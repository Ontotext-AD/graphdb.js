const Service = require('./service');
const HttpRequestBuilder = require('../http/http-request-builder');
const ServiceRequest = require('./service-request');
const PATH_SIZE = require('./service-paths').PATH_SIZE;

const TermConverter = require('../model/term-converter');
const LoggingUtils = require('../logging/logging-utils');

/**
 * Service for working repositories.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class RepositoryService extends Service {
  /**
   * Retrieves the size of the repository.
   *
   * Effectively returns how much statements are in the repository.
   *
   * If one or multiple context are provided, the operation will be restricted
   * upon each of them.
   *
   * @param {string|string[]} [context] context or contexts to restrict the
   * size calculation. Will be encoded as N-Triple if it is not already one
   *
   * @return {ServiceRequest} a service request resolving to the total number of
   * statements in the repository
   */
  getSize(context) {
    const requestBuilder = HttpRequestBuilder.httpGet(PATH_SIZE)
      .addParam('context', TermConverter.toNTripleValues(context));

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        const logPayload = LoggingUtils.getLogPayload(response, {context});
        this.logger.debug(logPayload, 'Fetched size');
        return response.getData();
      });
    });
  }

  /**
   * @inheritDoc
   */
  getServiceName() {
    return 'RepositoryService';
  }
}

module.exports = RepositoryService;
