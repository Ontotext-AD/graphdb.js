/**
 * Wrapper for HTTP responses.
 *
 * Includes the HTTP client that performed the request and received the response
 * and the elapsed time in milliseconds.
 *
 * @class
 * @author Mihail Radkov
 */
class HttpResponse {
  /**
   * Constructs new wrapper with the supplied response and client.
   * @param {AxiosResponse} response the HTTP response
   * @param {HttpClient} httpClient client that performed the HTTP request
   */
  constructor(response, httpClient) {
    this.response = response;
    this.httpClient = httpClient;
  }

  /**
   * Returns the HTTP response's data.
   *
   * @return {string|any} the response data
   */
  getData() {
    return this.response.data;
  }

  /**
   * Returns the HTTP response's headers.
   *
   * @return {{object}} the headers map
   */
  getHeaders() {
    return this.response.headers;
  }

  /**
   * Sets the elapsed time of the request and response.
   *
   * @param {number} elapsedTime the elapsed time in milliseconds
   */
  setElapsedTime(elapsedTime) {
    this.elapsedTime = elapsedTime;
  }

  /**
   * Returns the elapsed time of the HTTP request execution.
   *
   * @return {number} the elapsed time in milliseconds
   */
  getElapsedTime() {
    return this.elapsedTime;
  }

  /**
   * Returns the base URL to which this request was performed.
   *
   * @return {string} the base URL
   */
  getBaseURL() {
    return this.httpClient.getBaseURL();
  }
}

module.exports = HttpResponse;
