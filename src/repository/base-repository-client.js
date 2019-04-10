import {ParserRegistry} from '../parser/parser-registry';
import {ConsoleLogger} from '../logging/console-logger';

/**
 * Implementation of the RDF repository operations.
 * @abstract
 * @class
 */
export class BaseRepositoryClient {
  /**
   * @param {RepositoryClientConfig} repositoryClientConfig
   */
  constructor(repositoryClientConfig) {
    this.repositoryClientConfig = repositoryClientConfig;

    this.initParsers();
    this.initLogger();
    this.initHttpClient();
  }

  /**
   * Template method which should resolve with concrete endpoint url.
   * @abstract
   */
  getEndpoint() {

  }

  /**
   * Initializes the parser registry with default supported parsers.
   */
  initParsers() {
    this.parserRegistry = new ParserRegistry();
  }

  /**
   * Initializes a logger instance.
   */
  initLogger() {
    this.logger = new ConsoleLogger();
  }

  /**
   * Initializes the http client.
   */
  initHttpClient() {

  }
}
