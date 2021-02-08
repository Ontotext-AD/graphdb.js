const Service = require('./service');
const HttpRequestBuilder = require('../http/http-request-builder');
const PATH_TRANSACTIONS = require('./service-paths').PATH_TRANSACTIONS;

const LoggingUtils = require('../logging/logging-utils');
const StringUtils = require('../util/string-utils');

const ClientConfigBuilder =
  require('../http/client-config-builder');
const TransactionalRepositoryClient =
  require('../transaction/transactional-repository-client');

/**
 * Service for working with the transactions endpoint.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Teodossi Dossev
 */
class TransactionService extends Service {
  /**
   * Instantiates the transaction service with the supplied executor and
   * repository client config.
   *
   * @param {Function} httpRequestExecutor used to execute HTTP requests
   * @param {RepositoryClientConfig} repositoryClientConfig used to create
   * transaction client configurations
   */
  constructor(httpRequestExecutor, repositoryClientConfig) {
    super(httpRequestExecutor);
    this.repositoryClientConfig = repositoryClientConfig;
  }

  /**
   * Starts a transaction and produces a {@link TransactionalRepositoryClient}.
   *
   * The transactions ID is extracted from the <code>location</code> header and
   * is used as  endpoint for the produced TransactionalRepositoryClient.
   *
   * If no transaction isolation level is provided, the server will use its
   * default isolation level.
   *
   * @param {string} [isolationLevel] an optional parameter to specify the
   * transaction's level of isolation; for possible values see
   * {@link TransactionIsolationLevel}
   *
   * @return {Promise<TransactionalRepositoryClient>} transactional client
   */
  beginTransaction(isolationLevel) {
    const requestBuilder = HttpRequestBuilder.httpPost(PATH_TRANSACTIONS)
      .addParam('isolation-level', isolationLevel);

    return this.httpRequestExecutor(requestBuilder).then((response) => {
      const locationUrl = response.getHeaders()['location'];
      if (StringUtils.isBlank(locationUrl)) {
        this.logger.error(LoggingUtils.getLogPayload(response,
          {isolationLevel}), 'Cannot obtain transaction ID');
        return Promise.reject(new Error('Couldn\'t obtain transaction ID'));
      }

      const config = this.getTransactionalClientConfig(locationUrl);
      const transactionClient = new TransactionalRepositoryClient(config);

      this.logger.debug(LoggingUtils.getLogPayload(response, {isolationLevel}),
        'Started transaction');
      return transactionClient;
    });
  }

  /**
   * Builds client configuration for transactional repository out of the
   * provided repository client config and the supplied location URL.
   *
   * @private
   *
   * @param {string} locationUrl the url for the transactional repo endpoint
   *
   * @return {RepositoryClientConfig} the built transaction client config
   */
  getTransactionalClientConfig(locationUrl) {
    const config = this.repositoryClientConfig;
    return new ClientConfigBuilder()
      .repositoryConfig(config.getEndpoint())
      .setEndpoints([locationUrl])
      .setHeaders(config.getHeaders())
      .setDefaultRDFMimeType(config.getDefaultRDFMimeType())
      .setReadTimeout(config.getReadTimeout())
      .setWriteTimeout(config.getWriteTimeout());
  }

  /**
   * @inheritDoc
   */
  getServiceName() {
    return 'TransactionService';
  }
}

module.exports = TransactionService;
