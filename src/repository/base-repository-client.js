const ParserRegistry = require('parser/parser-registry');
const ConsoleLogger = require('logging/console-logger');
const HttpClient = require('http/http-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const Iterable = require('util/iterable');

/**
 * Set of HTTP status codes for which requests could be re-attempted.
 *
 * @type {number[]}
 */
const RETRIABLE_STATUSES = [
  503 // Server busy
];

/**
 * Defines a path segment for statements rest endpoint
 *
 * @type {string}
 */
const PATH_STATEMENTS = '/statements';

/**
 * Implementation of the RDF repository operations.
 *
 * The repository will construct a list of HTTP clients for each supplied
 * repository endpoint in the configuration. These clients will be used as
 * fallback strategy.
 *
 * @abstract
 * @class
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
      return new HttpClient(endpoint).setDefaultHeaders(config.headers);
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
   * Retrieves the size of the repository.
   *
   * Effectively returns how much statements are in the repository.
   *
   * If one or multiple context are provided, the operation will be restricted
   * upon each of them.
   *
   * @param {string|string[]} [context] context or contexts to restrict the
   *                            size calculation
   * @return {Promise<number>} a promise resolving to the total number of
   *                           statements in the repository
   */
  getSize(context) {
    return this.execute((http) => http.get('/size', {
      timeout: this.repositoryClientConfig.readTimeout,
      params: {
        context
      }
    })).then((response) => response.data);
  }

  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * @param {Object} params is an object holding request parameters as returned
   *                 by {@link GetStatementsPayload}#get()
   * @return {Promise<string|Quad>} resolves with plain string or Quad according
   *      to provided response type.
   */
  get(params) {
    return this.execute((http) => {
      return http.get(PATH_STATEMENTS, {
        params: {
          subj: params.subject,
          pred: params.predicate,
          obj: params.object,
          context: params.context,
          infer: params.inference
        },
        headers: {
          'Accept': params.responseType
        },
        timeout: this.repositoryClientConfig.readTimeout
      });
    }).then((response) => {
      return this.parse(response.data, params.responseType);
    });
  }

  /**
   * Parses provided content with registered parser if there is one. Otherwise
   * returns the content untouched. If <code>contentType</code> is provided it
   * should be an instance of {@link RdfContentType} enum and is used as a key
   * for selecting appropriate parser from the parsers registry.
   * Parsing is done synchronously!
   *
   * @private
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
   * Deletes statements in the repository based on the provided subject,
   * predicate, object and or contexts. Each of them is optional and acts as
   * statements filter which effectively narrows the scope of the deletion.
   *
   * Providing context or contexts will restricts the operation to one or more
   * specific contexts in the repository.
   *
   * @param {String} [subject] N-Triples encoded resource subject
   * @param {String} [predicate] N-Triples encoded resource predicate
   * @param {String} [object] N-Triples encoded resource object
   * @param {String[]|String} [contexts] N-Triples encoded resource or resources
   * @return {Promise} promise that will be resolved if the deletion is
   *                         successful or rejected in case of failure
   */
  deleteStatements(subject, predicate, object, contexts) {
    return this.execute((http) => http.deleteResource(PATH_STATEMENTS, {
      timeout: this.repositoryClientConfig.writeTimeout,
      params: {
        subj: subject,
        pred: predicate,
        obj: object,
        context: contexts
      }
    }));
  }

  /**
   * Deletes all statements in the repository.
   *
   * @return {Promise} promise that will be resolved if the deletion is
   *                   successful or rejected in case of failure
   */
  deleteAllStatements() {
    return this.execute((http) => http.deleteResource(PATH_STATEMENTS, {
      timeout: this.repositoryClientConfig.writeTimeout
    }));
  }

  /**
   * Executor for http requests. It supplies the provided HTTP client consumer
   * with a HTTP client for executing requests.
   *
   * If the request was unsuccessful it will be retried with another endpoint
   * HTTP client in case the request's status is one of
   * {@link RETRIABLE_STATUSES} or if the host is currently unreachable.
   *
   * If the retry was unsuccessful with all available endpoint clients, then the
   * execution will perform a timeout retry based on the configured timeout
   * amount and count. This will start from the first http client.
   *
   * If all of the endpoints & timeout are unsuccessful then the execution will
   * fail with promise rejection.
   *
   * @protected
   * @param {Function} httpClientConsumer the consumer of supplied http client
   *                                      that performs the request execution
   * @return {Promise<any>} a promise which resolves to http request response
   */
  execute(httpClientConsumer) {
    const httpClients = new Iterable(this.httpClients);
    return this.retryExecution(httpClients, httpClientConsumer, 0);
  }

  /**
   * Retries HTTP request execution until successful or until no more retries
   * and/or clients are left.
   *
   * @private
   * @param {Iterable} httpClients iterable collection of http clients
   * @param {Function} httpClientConsumer the consumer of supplied http client
   *                                      that performs the request execution
   * @param {number} retries current amounts of attempted retries
   * @return {Promise<any>} a promise which resolves to http request response
   */
  retryExecution(httpClients, httpClientConsumer, retries) {
    return httpClientConsumer(httpClients.next()).catch((error) => {
      if (BaseRepositoryClient.canRetryExecution(error)) {
        // Try the next endpoint client (if any)
        if (httpClients.hasNext()) {
          return this.retryExecution(httpClients, httpClientConsumer, retries);
        }

        // If there are no clients left to retry with -> timeout and try again
        // from the first endpoint client
        if (retries < this.repositoryClientConfig.retryCount) {
          return this.retryWithTimeout(httpClients.reset(), httpClientConsumer,
              ++retries);
        }
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
    // The current client couldn't get a response from the server, try again
    if (!error.response) {
      return true;
    }
    const status = error.response.status;
    return RETRIABLE_STATUSES.indexOf(status) > -1;
  }

  /**
   * Retries the HTTP request execution after the configured repository
   * retry timeout.
   *
   * @private
   * @param {Iterable} httpClients iterable collection of http clients
   * @param {Function} httpClientConsumer the consumer of supplied http client
   *                                      that performs the request execution
   * @param {number} retries current amounts of attempted retries
   * @return {Promise<any>} a promise which resolves to http request response
   */
  retryWithTimeout(httpClients, httpClientConsumer, retries) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        this.retryExecution(httpClients, httpClientConsumer, retries)
            .then(resolve, reject);
      }, this.repositoryClientConfig.retryInterval);
    });
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
