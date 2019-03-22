import BaseRepositoryConfig from './base-repository-config';

/**
 * Class for repository configuration.
 * @class RepositoryConfig
 * @extends BaseRepositoryConfig
 */
class RepositoryConfig extends BaseRepositoryConfig {
  /**
   * Constructor for repository configuration class.
   * @param { number } retryInterval
   * @param { number } readTimeout
   * @param { number } writeTimeout
   * @param { object } headers
   * @param { string } rdfResponseType
   * @param { string } sparqlResponseType
   * @param { function } responseParsers
   * @param { function } responseIterators
   * @param { Array.<Object> } endpoints
   */
  constructor(retryInterval, readTimeout, writeTimeout, headers,
      rdfResponseType, sparqlResponseType, responseParsers,
      responseIterators, endpoints) {
    super(retryInterval, readTimeout, writeTimeout, headers);
    this.rdfResponseType = rdfResponseType;
    this.sparqlResponseType = sparqlResponseType;
    this.responseParsers = responseParsers;
    this.responseIterators = responseIterators;
    this.endpoints = endpoints;
  }
}

export default RepositoryConfig;
