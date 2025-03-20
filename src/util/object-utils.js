/**
 * Utility class for common object-related checks.
 *
 * @class
 */
class ObjectUtils {
  /**
  * Checks if the given object is strictly null.
  *
  * @param {*} object The object to check.
  * @return {boolean} True if the object is null, false otherwise.
  */
  static isNull(object) {
    return object === null;
  }

  /**
  * Checks if the given object is strictly undefined.
  *
  * @param {*} object The object to check.
  * @return {boolean} True if the object is undefined, false otherwise.
  */
  static isUndefined(object) {
    return object === undefined;
  }

  /**
  * Checks if the given object is either null or undefined.
  *
  * @param {*} object The object to check.
  * @return {boolean} True if the object is null or undefined, false otherwise.
  */
  static isNullOrUndefined(object) {
    return ObjectUtils.isNull(object) || ObjectUtils.isUndefined(object);
  }
}

module.exports = ObjectUtils;
