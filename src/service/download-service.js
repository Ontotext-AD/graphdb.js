const Service = require('./service');
const HttpRequestBuilder = require('../http/http-request-builder');
const ServiceRequest = require('./service-request');
const PATH_STATEMENTS = require('./service-paths').PATH_STATEMENTS;

const LoggingUtils = require('../logging/logging-utils');
const TermConverter = require('../model/term-converter');

/**
 * Service for downloading data via {@link GetStatementsPayload}.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class DownloadService extends Service {
  /**
   * Fetch rdf data from statements endpoint using provided parameters.
   *
   * The request is configured so that expected response should be a readable
   * stream.
   *
   * Provided request params will be automatically converted to N-Triples if
   * they are not already encoded as such.
   *
   * @param {GetStatementsPayload} payload is an object holding request params
   *
   * @return {ServiceRequest} a service request that will resolve to a readable
   * stream to which the client can subscribe and consume the emitted strings
   * depending on the provided response type as soon as they are available.
   */
  download(payload) {
    const requestBuilder = HttpRequestBuilder.httpGet(PATH_STATEMENTS)
      .addAcceptHeader(payload.getResponseType())
      .setResponseType('stream')
      .setParams({
        subj: TermConverter.toNTripleValue(payload.getSubject()),
        pred: TermConverter.toNTripleValue(payload.getPredicate()),
        obj: TermConverter.toNTripleValue(payload.getObject()),
        context: TermConverter.toNTripleValues(payload.getContext()),
        infer: payload.getInference()
      });

    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        this.logger.debug(LoggingUtils.getLogPayload(response,
          requestBuilder.getParams()), 'Downloaded data');
        return response.getData();
      });
    });
  }

  /**
   * @inheritDoc
   */
  getServiceName() {
    return 'DownloadService';
  }
}

module.exports = DownloadService;
