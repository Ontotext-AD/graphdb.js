const ContentTypeParser = require('./content-type-parser');

/**
 * Implementation of registry holding {@link ContentTypeParser} instances and
 * providing interface for registration and access.
 * If this registry is not provided with a list with parsers then it is
 * initialized empty. Otherwise provided parsers are validated if they are
 * compatible with the {@link ContentTypeParser} interface and an error is
 * thrown if there are invalid parsers.
 *
 * @class
 */
class ParserRegistry {
  /**
   * @param {ContentTypeParser[]} [parsers] initialized list with valid parser
   * instances.
   */
  constructor(parsers = []) {
    this.parsers = {};
    this.validateParsers(parsers);
    this.init(parsers);
  }

  /**
   * Register provided {@link ContentTypeParser} under given key as returned by
   * <code>parser.getSupportedType()</code>.
   * If the type of the provided parser is already registered, then this method
   * will override the registered parser with the provided instance.
   *
   * @param {ContentTypeParser} parser implementation wrapper.
   */
  register(parser) {
    ParserRegistry.validateParser(parser);

    // TODO: log a warning about overriding existing parser!

    this.parsers[parser.getSupportedType()] = parser;
  }

  /**
   * Getter for parser of given type.
   *
   * @param {string} type of the parser for get.
   * @return {ContentTypeParser} if parser of requested type is found or
   * <code>null</code> otherwise.
   */
  get(type) {
    return this.parsers[type];
  }

  /**
   * Maps provided parsers by their supported content type.
   *
   * @private
   * @param {ContentTypeParser[]} parsers provided with the constructor.
   */
  init(parsers) {
    parsers.forEach((parser) => {
      this.parsers[parser.getSupportedType()] = parser;
    });
  }

  /**
   * @private
   * @param {ContentTypeParser[]} parsers
   */
  validateParsers(parsers) {
    parsers.forEach((parser) => {
      ParserRegistry.validateParser(parser);
    });
  }

  /**
   * @private
   * @param {ContentTypeParser} parser to be validated
   */
  static validateParser(parser) {
    if (!parser || !(parser instanceof ContentTypeParser)) {
      throw new Error('Parser is not provided or does not implement'
        + ' ContentTypeParser!');
    }
    if (!parser.getSupportedType()) {
      throw new Error('Parser type is mandatory parameter!');
    }
  }
}

module.exports = ParserRegistry;
