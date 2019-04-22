/**
 * Class with utility methods related to strings.
 *
 * @author Mihail Radkov
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
}

module.exports = StringUtils;
