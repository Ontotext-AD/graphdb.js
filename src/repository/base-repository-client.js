const ParserRegistry = require('../parser/parser-registry');
const ConsoleLogger = require('../logging/console-logger');
const HttpClient = require('../http/http-client');
const RepositoryClientConfig =
  require('../repository/repository-client-config');
const Iterable = require('../util/iterable');

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
    this.logger = new ConsoleLogger();
  }

  /**
   * Initializes http clients depending on the provided endpoints.
   * @private
   */
  initHttpClients() {
    const config = this.repositoryClientConfig;
    // Constructs a http client for each endpoint
    this.httpClients = config.endpoints.map((endpoint) => {
      return new HttpClient(endpoint, config.readTimeout, config.writeTimeout)
        .setDefaultHeaders(config.headers)
        .setDefaultReadTimeout(config.readTimeout)
        .setDefaultWriteTimeout(config.writeTimeout);
    });
  }

  /**
   * Register provided parser in the internal parser registry.
   *
   * @param {ContentTypeParser} parser implementation wrapper.
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
   * @return {(string|Term|Term[])}
   */
  parse(content, responseType) {
    if (!this.parserRegistry.get(responseType)) {
      return content;
    }
    const parser = this.parserRegistry.get(responseType);
    return parser.parse(content);
  }

  /**
   * Executor for http requests. It supplies the provided HTTP client consumer
   * with a HTTP client for executing requests.
   *
   * If the request was unsuccessful it will be retried with another endpoint
   * HTTP client in case the request's status is one of
   * {@link RETRIABLE_STATUSES} or if the host is currently unreachable.
   *
   * If all of the endpoints are unsuccessful then the execution will fail
   * with promise rejection.
   *
   * By default, when the request is successful, it automatically resolves the
   * response data object. To override it use the <code>responseMapper</code>
   * parameter.
   *
   * @protected
   * @param {Function} httpClientConsumer the consumer of supplied http client
   *                                      that performs the request execution
   * @param {Function} [responseMapper] a mapper for the response object
   * @return {Promise<any>} a promise which resolves to http request response or
   * rejects with error if thrown during execution.
   */
  execute(httpClientConsumer, responseMapper) {
    try {
      const httpClients = new Iterable(this.httpClients);
      return this.retryExecution(httpClients, httpClientConsumer,
        responseMapper);
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
   * @param {Function} httpClientConsumer the consumer of supplied http client
   *                                      that performs the request execution
   * @param {Function} [responseMapper] a mapper for the response object
   * @return {Promise<any>} a promise which resolves to http request response
   */
  retryExecution(httpClients, httpClientConsumer, responseMapper) {
    return httpClientConsumer(httpClients.next()).then((response) => {
      if (responseMapper) {
        return responseMapper(response);
      }
      return response.data;
    }).catch((error) => {
      if (BaseRepositoryClient.canRetryExecution(error)
        && httpClients.hasNext()) {
        // Try the next endpoint client (if any)
        return this.retryExecution(httpClients, httpClientConsumer,
          responseMapper);
      }
      // Not retriable
      return Promise.reject(error);
    });
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
   */
  static validateConfig(repositoryClientConfig) {
    if (!(repositoryClientConfig instanceof RepositoryClientConfig)) {
      throw new Error('Cannot instantiate repository with unsupported config '
        + 'type!');
    }

    const endpoints = repositoryClientConfig.endpoints;
    if (!endpoints || !endpoints.length) {
      throw new Error('Cannot instantiate a repository without repository '
        + 'endpoint configuration! At least one endpoint must be provided.');
    }
  }
}

module.exports = BaseRepositoryClient;
