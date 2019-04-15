import {BaseRepositoryClient} from './base-repository-client';

/**
 * RDF repository client implementation realizing specific operations.
 * @class
 */
export class RDFRepositoryClient extends BaseRepositoryClient {
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
