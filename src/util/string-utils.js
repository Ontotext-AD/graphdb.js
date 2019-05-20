/**
 * Class with utility methods related to strings.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class StringUtils {
  /**
   * Tells if the provided string is null or blank ignoring
   * whitespace characters.
   *
   * @param {string} string the string to check
   * @return {boolean} <code>true</code> if the string is blank or
   *                    <code>false</code> otherwise
   */
  static isBlank(string) {
    return !string || !string.trim().length;
  }

  /**
   * Tells if the provided string is NOT null and NOT blank ignoring
   * whitespace characters.
   *
   * @param {string} string the string to check
   * @return {boolean} <code>true</code> if the string is not blank or
   *                    <code>false</code> otherwise
   */
  static isNotBlank(string) {
    return !StringUtils.isBlank(string);
  }
}

module.exports = StringUtils;
