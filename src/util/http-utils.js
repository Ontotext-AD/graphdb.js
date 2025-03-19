/**
 * Utility class for HTTP-related helper methods.
 * @class
 * @author Boyan Tonchev
 */
class HttpUtils {
  /**
   * Utility method which serializes a single level json object to properly
   * encoded string that can be used in a request.
   *
   * @private
   * @param {Object} data object which holds request parameter key:value pairs.
   * @return {string} provided object serialized and encoded to string.
   */
  static serialize(data) {
    return Object.entries(data)
      .filter((x) => x[1] !== undefined)
      .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
      .join('&');
  }
}

module.exports = HttpUtils;
