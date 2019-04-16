const BaseRepositoryClient = require('../repository/base-repository-client');

/**
 * RDF repository client implementation realizing specific operations.
 * @class
 */
class RDFRepositoryClient extends BaseRepositoryClient {
  /**
   * @inheritdoc
   */
  constructor(repositoryClientConfig) {
    super(repositoryClientConfig);
  }

  /**
   * @inheritdoc
   */
  getEndpoint() {
    return null;
  }
}

module.exports = RDFRepositoryClient;
