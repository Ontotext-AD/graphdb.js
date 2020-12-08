const ParserRegistry = require('../parser/parser-registry');
const ConsoleLogger = require('../logging/console-logger');
const HttpClient = require('../http/http-client');
const RepositoryClientConfig =
  require('../repository/repository-client-config');
const Iterable = require('../util/iterable');
const HttpResponse = require('../http/http-response');
const LoggingUtils = require('../logging/logging-utils');
const AuthenticationService = require('../service/authentication-service');

/**
 * Set of HTTP status codes for which requests could be re-attempted.
 *
 * @type {number[]}
 */
const RETRIABLE_STATUSES = [
  503 // Server busy
];

/**
 * Implementation of the RDF repository operations.
 *
 * The repository will construct a list of HTTP clients for each supplied
 * repository endpoint in the configuration. These clients will be used as
 * fallback strategy.
 *
 * @abstract
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class BaseRepositoryClient {
  /**
   * Constructs a repository client with the provided configuration.
   *
   * @param {RepositoryClientConfig} repositoryClientConfig
   */
  constructor(repositoryClientConfig) {
    BaseRepositoryClient.validateConfig(repositoryClientConfig);
    this.repositoryClientConfig = repositoryClientConfig;

    this.authenticationService = new AuthenticationService();

    this.initParsers();
    this.initLogger();
    this.initHttpClients();
  }

  /**
   * Initializes the parser registry with default supported parsers.
   * @private
   */
  initParsers() {
    this.parserRegistry = new ParserRegistry();
  }

  /**
   * Initializes a logger instance.
   * @private
   */
  initLogger() {
    this.logger = this.getLogger();
  }

  /**
   * Gets a logger instance.
   *
   * @return {Logger} the logger instance
   */
  getLogger() {
    return new ConsoleLogger();
  }

  /**
   * Initializes http clients depending on the provided endpoints.
   * @private
   */
  initHttpClients() {
    const config = this.repositoryClientConfig;
    // Constructs a http client for each endpoint
    this.httpClients = config.getEndpoints().map((endpoint) => {
      return new HttpClient(endpoint)
        .setDefaultHeaders(config.getHeaders())
        .setDefaultReadTimeout(config.getReadTimeout())
        .setDefaultWriteTimeout(config.getWriteTimeout());
    });
  }

  /**
   * Register provided parser in the internal parser registry.
   *
   * @param {ContentParser} parser implementation wrapper.
   */
  registerParser(parser) {
    this.parserRegistry.register(parser);
  }

  /**
   * Parses provided content with registered parser if there is one. Otherwise
   * returns the content untouched. If <code>contentType</code> is provided it
   * should be an instance of {@link RDFMimeType} enum and is used as a key
   * for selecting appropriate parser from the parsers registry.
   * Parsing is done synchronously!
   *
   * @protected
   * @param {string} content
   * @param {string} responseType
   * @param {Object} [parserConfig] optional parser configuration
   * @return {(string|Term|Term[])}
   */
  parse(content, responseType, parserConfig = {}) {
    if (!this.parserRegistry.get(responseType)) {
      return content;
    }
    const parser = this.parserRegistry.get(responseType);

    const startTime = Date.now();
    const parsed = parser.parse(content, parserConfig);
    const elapsedTime = Date.now() - startTime;

    this.logger.debug({elapsedTime, responseType}, 'Parsed content');
    return parsed;
  }

  /**
   * Executor for http requests. It passes the provided HTTP request builder
   * to a HTTP client for executing requests.
   *
   * If the request was unsuccessful it will be retried with another endpoint
   * HTTP client in case the request's status is one of
   * {@link RETRIABLE_STATUSES} or if the host is currently unreachable.
   *
   * If all of the endpoints are unsuccessful then the execution will fail
   * with promise rejection.
   *
   * @protected
   * @param {HttpRequestBuilder} requestBuilder the http request data to be
   * passed to a http client
   * @return {Promise<HttpResponse|Error>} a promise which resolves to response
   * wrapper or rejects with error if thrown during execution.
   */
  execute(requestBuilder) {
    try {
      const startTime = Date.now();
      const httpClients = new Iterable(this.httpClients);
      return this.retryExecution(httpClients, requestBuilder)
        .then((executionResponse) => {
          executionResponse.setElapsedTime(Date.now() - startTime);
          return executionResponse;
        });
    } catch (err) {
      return Promise.reject(err);
    }
  }

  /**
   * Retries HTTP request execution until successful or until no more clients
   * are left if the status is allowed for retry.
   *
   * @private
   * @param {Iterable} httpClients iterable collection of http clients
   * @param {HttpRequestBuilder} requestBuilder the http request data to be
   * passed to a http client
   * @param {HttpClient} [currentHttpClient] current client is passed only if
   * the retry is invoked directly in result of some error handler which may try
   * to re-execute the request to the same server.
   * @return {Promise<HttpResponse|Error>} a promise which resolves to response
   * wrapper or rejects with error if thrown during execution.
   */
  retryExecution(httpClients, requestBuilder, currentHttpClient) {
    const httpClient = currentHttpClient || httpClients.next();
    const username = this.repositoryClientConfig.getUsername();
    const pass = this.repositoryClientConfig.getPass();
    return this.authenticationService.setHttpClient(httpClient)
      .login(username, pass)
      .then(() => {
        this.decorateRequestConfig(requestBuilder);
        return httpClient.request(requestBuilder).then((response) => {
          return new HttpResponse(response, httpClient);
        }).catch((error) => {
          const status = error.response ? error.response.status : null;
          const isUnauthorized = status && status === 401;
          if (isUnauthorized && this.repositoryClientConfig.getKeepAlive()) {
            // re-execute will try to re-login the user and update it
            return this.retryExecution(httpClients, requestBuilder, httpClient);
          }

          const canRetry = BaseRepositoryClient.canRetryExecution(error);
          const hasNext = httpClients.hasNext();

          const loggerPayload = {repositoryUrl: httpClient.getBaseURL()};

          // Try the next repo http client (if any)
          if (canRetry && hasNext) {
            this.logger.warn(loggerPayload, 'Retrying execution');
            return this.retryExecution(httpClients, requestBuilder);
          }

          if (!canRetry) {
            this.logger.error(loggerPayload, 'Cannot retry execution');
          } else {
            this.logger.error(loggerPayload, 'No more retries');
          }

          // Not retriable
          return Promise.reject(error);
        });
      });
  }

  /**
   * Allow request config to be altered before sending.
   *
   * @private
   * @param {HttpRequestBuilder} requestBuilder
   */
  decorateRequestConfig(requestBuilder) {
    const token = this.authenticationService.getAuthentication();
    if (token) {
      requestBuilder.addAuthorizationHeader(token);
    }
  }

  /**
   * Creates an object from the provided HTTP response that is suitable for
   * structured logging.
   *
   * Any additional key-value entries from <code>params</code> will be assigned
   * in the created payload object.
   *
   * @protected
   * @param {HttpResponse} response the HTTP response.
   * Used to get the execution time and the base URL
   * @param {object} [params] additional parameters to be appended
   * @return {object} the constructed payload object for logging
   */
  getLogPayload(response, params) {
    return LoggingUtils.getLogPayload(response, params);
  }

  /**
   * Checks if the request that produced the provided error can be re-attempted.
   *
   * @private
   * @param {Object} error the error to check
   * @return {boolean} <code>true</code> if it can be attempted again or
   *                    <code>false</code> otherwise
   */
  static canRetryExecution(error) {
    // Not an error from the HTTP client, do not retry
    if (!error || !error.request) {
      return false;
    }
    // The current client couldn't get a response from the server, try again
    if (!error.response) {
      return true;
    }
    const status = error.response.status;
    return RETRIABLE_STATUSES.indexOf(status) > -1;
  }

  /**
   * Validates the provided repository client configuration.
   *
   * @private
   * @param {RepositoryClientConfig} repositoryClientConfig the config to check
   * @throws {Error} if the configuration is not an instance of
   * {@link RepositoryClientConfig} or there are no configured endpoints
   */
  static validateConfig(repositoryClientConfig) {
    if (!(repositoryClientConfig instanceof RepositoryClientConfig)) {
      throw new Error('Cannot instantiate repository with unsupported config '
        + 'type!');
    }

    const endpoints = repositoryClientConfig.getEndpoints();
    if (!endpoints || !endpoints.length) {
      throw new Error('Cannot instantiate a repository without repository '
        + 'endpoint configuration! At least one endpoint must be provided.');
    }
  }
}

module.exports = BaseRepositoryClient;
