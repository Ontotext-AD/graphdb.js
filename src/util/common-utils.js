/**
 * Common utility functions.
 *
 * @class
 * @author Mihail Radkov
 */
class CommonUtils {
  /**
   * Checks if at least one of the supplied arguments is undefined or null.
   *
   * @return {boolean} <code>true</code> if there is null argument or
   *         <code>false</code> otherwise
   */
  static hasNullArguments(...args) {
    return [...args].some((arg) => !arg);
  }
}

module.exports = CommonUtils;
