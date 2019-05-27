/**
 * Abstract class defining the API for content type parsers.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ContentTypeParser {
  /**
   * @param {boolean} isDefault if the implementation is configured as default.
   */
  constructor(isDefault) {
    this.default = isDefault !== undefined ? isDefault : false;
  }

  /**
   * @return {boolean} <code>true</code> if current implementation is set as
   * default and <code>false</code> otherwise.
   */
  isDefault() {
    return this.default;
  }

  /**
   * Implementations should delegate the actual parsing to underlying parser
   * library or to a custom implementation.
   *
   * @abstract
   * @param {string} content which has to be parsed to given format.
   * @param {Object} [config] optional parser configuration.
   * @return {Term} the converted content.
   */
  parse(content, config) {
    throw new Error('Method #parse(content) must be implemented!');
  }

  /**
   * @abstract
   * @return {string} the type which underlying parser supports which should be
   * the type under which it was registered in the parser registry.
   */
  getSupportedType() {
    throw new Error('Method #getSupportedType() must be implemented!');
  }
}

module.exports = ContentTypeParser;
