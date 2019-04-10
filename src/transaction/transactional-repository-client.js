import {BaseRepositoryClient} from '/base-repository-client';

/**
 * Transactional RDF repository client implementation realizing transaction
 * specific operations.
 * @class
 */
export class TransactionalRepositoryClient extends BaseRepositoryClient {
  /**
   * @param {RepositoryClientConfig} repositoryClientConfig
   * @param {string} transactionUri
   */
  constructor(repositoryClientConfig, transactionUri) {
    super(repositoryClientConfig);
    this.transactionUri = transactionUri;
  }

  /**
   * @inheritdoc
   */
  getEndpoint() {
    return null;
  }
}
