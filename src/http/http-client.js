import axios from 'axios';

/**
 * Promise based HTTP client that delegates requests to Axios.
 *
 * The purpose of the delegating is to have an abstraction layer on top of the
 * used library.
 *
 * @class
 * @author Mihail Radkov
 */
export class HttpClient {
  /**
   * Instantiates new HTTP client with the supplied base URL and default
   * request timeout.
   *
   * @constructor
   * @param {string} baseUrl base URL that will be prepend to all requests
   * @param {number} timeout default timeout for all requests; if 0 or negative
   *                         there will be no timeout
   */
  constructor(baseUrl, timeout) {
    this.axios = axios.create({baseUrl, timeout});
  }

  /**
   * Performs a GET request to the provided URL with the given request
   * configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} config request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  get(url, config) {
    return this.axios.get(url, config);
  }

  /**
   * Performs a POST request to the provided URL with the given payload and
   * request configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} data the request body
   * @param {object} config request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  post(url, data, config) {
    return this.axios.post(url, data, config);
  }

  /**
   * Performs a PUT request to the provided URL with the given payload and
   * request configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} data the request body
   * @param {object} config request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  put(url, data, config) {
    return this.axios.put(url, data, config);
  }

  /**
   * Performs a DELETE request to the provided URL with the given request
   * configuration.
   *
   * Note: If <code>baseUrl</code> is defined, it will be prepend to the
   * given URL.
   *
   * @param {string} url URL to the requested resource
   * @param {object} config request configuration that can include params
   *                        and headers
   * @return {Promise<any>} a promise resolving to the request's response
   */
  deleteResource(url, config) {
    return this.axios.delete(url, config);
  }
}
