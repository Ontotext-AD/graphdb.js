/**
 * Utilities related to logging.
 *
 * @author Mihail Radkov
 */
class LoggingUtils {
  /**
   * Creates an object from the provided HTTP response that is suitable for
   * structured logging.
   *
   * Any additional key-value entries from <code>params</code> will be assigned
   * in the created payload object.
   *
   * @protected
   * @param {HttpResponse} response the HTTP response.
   * Used to get the execution time and the base URL
   * @param {object} [params] additional parameters to be appended
   * @return {object} the constructed payload object for logging
   */
  static getLogPayload(response, params = {}) {
    const payload = {
      elapsedTime: response.getElapsedTime(),
      repositoryUrl: response.getBaseURL()
    };
    Object.assign(payload, params);
    return payload;
  }
}

module.exports = LoggingUtils;
