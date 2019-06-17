/**
 * Wrapper class for service request.
 *
 * Contains the request builder and the executor function that will perform
 * the request and produce the results.
 *
 * This wrapper allows to modify the request builder before executing it,
 * preserving any chained promises to the executor.
 *
 * @author Mihail Radkov
 */
class ServiceRequest {
  /**
   * Instantiates the request with the supplied builder and executor.
   *
   * @param {HttpRequestBuilder} httpRequestBuilder builder carrying
   * the request data and params
   * @param {Function} requestExecutor executor for HTTP requests
   */
  constructor(httpRequestBuilder, requestExecutor) {
    this.httpRequestBuilder = httpRequestBuilder;
    this.requestExecutor = requestExecutor;
  }

  /**
   * Returns the request builder.
   *
   * @return {HttpRequestBuilder}
   */
  getHttpRequestBuilder() {
    return this.httpRequestBuilder;
  }

  /**
   * Triggers service request execution.
   *
   * @return {Promise}
   */
  execute() {
    return this.requestExecutor();
  }
}

module.exports = ServiceRequest;
