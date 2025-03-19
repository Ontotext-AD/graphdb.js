const Service = require('./service');
const HttpRequestBuilder = require('../http/http-request-builder');
const ServiceRequest = require('./service-request');
const PATH_STATEMENTS = require('./service-paths').PATH_STATEMENTS;

const LoggingUtils = require('../logging/logging-utils');
const QueryContentType = require('../http/query-content-type');
const GetQueryPayload = require('../query/get-query-payload');
const UpdateQueryPayload = require('../query/update-query-payload');
const HttpUtils = require('../util/http-utils');

/**
 * Service for executing queries via {@link GetQueryPayload} or
 * {@link UpdateQueryPayload}.
 *
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class QueryService extends Service {
  /**
   * Instantiates the query service.
   *
   * @param {Function} httpRequestExecutor used to execute HTTP requests
   * @param {Function} parseExecutor function that will parse provided data
   */
  constructor(httpRequestExecutor, parseExecutor) {
    super(httpRequestExecutor);
    this.parseExecutor = parseExecutor;
  }

  /**
   * Executes request to query a repository.
   *
   * Only POST request with a valid QueryPayload is supported.
   *
   * @param {GetQueryPayload} payload is an object holding request parameters
   * required by the query POST endpoint.
   *
   * @return {ServiceRequest} a service request that will resolve to a readable
   * stream to which the client can subscribe and consume
   * the emitted strings or Quads depending on the provided response type as
   * soon as they are available.
   *
   * @throws {Error} if the payload is misconfigured
   */
  query(payload) {
    payload.validatePayload();
    const requestBuilder = HttpRequestBuilder.httpPost('')
      .setResponseType('stream')
      .addAcceptHeader(payload.getResponseType())
      .addContentTypeHeader(payload.getContentType());
    this.setPostRequestPayload(requestBuilder, payload);
    return new ServiceRequest(requestBuilder,
      () => this.executeQuery(payload, requestBuilder));
  }

  /**
   * Populates parameters and body data in the <code>httpRequestBuilder</code>
   * to comply with the SPARQL specification
   * {@link https://www.w3.org/TR/sparql11-protocol/}.
   *
   * For POST requests, there are two scenarios:
   *  - When the content type is "application/x-www-form-urlencoded",
   *    all parameters are sent as body content. The SPARQL query is added to
   *    the parameters: if the query is a SELECT (or similar read query),
   *    the parameter name is "query", otherwise, for updates,
   *    the parameter name is "update".
   *  - When the content type is "application/sparql-update" or
   *    "application/sparql-query", all parameters are sent as URL parameters,
   *    and the SPARQL query is sent as the raw body content without
   *    URL encoding.
   *
   * For more information about "application/sparql-update"
   * see {@link https://www.w3.org/TR/sparql11-protocol/#update-operation},
   * and for "application/sparql-query"
   * see {@link https://www.w3.org/TR/sparql11-protocol/#query-operation}.
   *
   * @private
   *
   * @param {HttpRequestBuilder} httpRequestBuilder - The HTTP request builder
   *             that holds all necessary information for a {@link HttpClient}.
   * @param {QueryPayload} payload - An object holding request parameters
   *              required by the query endpoint.
   */
  setPostRequestPayload(httpRequestBuilder, payload) {
    const params = Object.assign({}, payload.getParams());
    const query = payload.getQuery();

    if (payload.getContentType() === QueryContentType.X_WWW_FORM_URLENCODED) {
      if (payload instanceof GetQueryPayload) {
        params.query = query;
      } else {
        params.update = query;
      }
      httpRequestBuilder.setData(HttpUtils.serialize(params));
    } else {
      httpRequestBuilder.setData(query);
      if (params && Object.keys(params).length > 0) {
        httpRequestBuilder.setParams(params);
      }
    }
  }

  /**
   * Executes a query request with the supplied payload and request builder.
   *
   * @private
   *
   * @param {GetQueryPayload} payload an object holding request parameters
   * required by the query POST endpoint.
   * @param {HttpRequestBuilder} requestBuilder builder containing the request
   * parameters and data
   *
   * @return {Promise} promise resolving to parsed query response
   *
   * @throws {Error} if the payload is misconfigured
   */
  executeQuery(payload, requestBuilder) {
    return this.httpRequestExecutor(requestBuilder).then((response) => {
      const logPayload = LoggingUtils.getLogPayload(response, {
        query: payload.getQuery(),
        queryType: payload.getQueryType()
      });
      this.logger.debug(logPayload, 'Queried data');

      const parserConfig = {queryType: payload.getQueryType()};
      return this.parseExecutor(response.getData(), payload.getResponseType(),
        parserConfig);
    });
  }

  /**
   * Executes a request with a sparql query against <code>/statements</code>
   * endpoint to update repository data.
   *
   * If <code>contentType</code> is set to
   * <code>application/x-www-form-urlencoded</code> then query and request
   * parameters from the payload are encoded as query string and sent as request
   * body.
   *
   * If <code>contentType</code> is set to
   * <code>application/sparql-update</code> then the query is sent unencoded as
   * request body.
   *
   * @param {UpdateQueryPayload} payload
   *
   * @return {ServiceRequest} service request that will be resolved if the
   * update is successful or rejected in case of failure
   *
   * @throws {Error} if the payload is misconfigured
   */
  update(payload) {
    payload.validatePayload();
    const requestBuilder = HttpRequestBuilder.httpPost(PATH_STATEMENTS)
      .addContentTypeHeader(payload.getContentType());
    this.setPostRequestPayload(requestBuilder, payload);
    return new ServiceRequest(requestBuilder, () => {
      return this.httpRequestExecutor(requestBuilder).then((response) => {
        const logPayload = LoggingUtils.getLogPayload(response,
          {query: payload.getQuery()});
        this.logger.debug(logPayload, 'Performed update');
      });
    });
  }

  /**
   * @inheritDoc
   */
  getServiceName() {
    return 'StatementsService';
  }
}

module.exports = QueryService;
