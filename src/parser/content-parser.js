/**
 * Abstract class defining the API for content type parsers.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ContentParser {
  /**
   * @param {Object} config is an object containing the parser configuration.
   */
  constructor(config) {
    this.configureParser(config);
  }

  /**
   * Configure the parser instance.
   *
   * @private
   * @param {Object} config
   */
  configureParser(config = {}) {
    this.config = config;
  }

  /**
   * @return {Object} config is the passed during the initialization parser
   * config object.
   */
  getConfig() {
    return this.config;
  }

  /**
   * If implemented by successors, this must return boolean <code>true</code>
   * when the wrapped parser supports stream reading by default or
   * <code>false</code> otherwise.
   *
   * @abstract
   * @return {boolean} if the parser supports streaming by default
   */
  isStreaming() {
    return false;
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

module.exports = ContentParser;
