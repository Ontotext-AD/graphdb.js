const ContentParser = require('../parser/content-parser');
const ConsoleLogger = require('../logging/console-logger');

/**
 * Implementation of registry holding {@link ContentParser} instances and
 * providing interface for registration and access.
 * If this registry is not provided with a list with parsers then it is
 * initialized empty. Otherwise provided parsers are validated if they are
 * compatible with the {@link ContentParser} interface and an error is
 * thrown if there are invalid parsers.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class ParserRegistry {
  /**
   * @param {ContentParser[]} [parsers] initialized list with valid parser
   * instances.
   */
  constructor(parsers = []) {
    this.parsers = {};
    this.initLogger();
    this.validateParsers(parsers);
    this.init(parsers);
  }

  /**
   * Initializes a console logger.
   */
  initLogger() {
    this.logger = new ConsoleLogger({
      name: 'ParserRegistry'
    });
  }

  /**
   * Register provided {@link ContentParser} under given key as returned by
   * <code>parser.getSupportedType()</code>.
   * If the type of the provided parser is already registered, then this method
   * will override the registered parser with the provided instance.
   *
   * @param {ContentParser} parser implementation wrapper.
   */
  register(parser) {
    ParserRegistry.validateParser(parser);

    const supportedType = parser.getSupportedType();
    if (this.parsers[supportedType]) {
      this.logger.warn({parserType: supportedType},
        'Overriding registered parser');
    }

    this.parsers[parser.getSupportedType()] = parser;
  }

  /**
   * Getter for parser of given type.
   *
   * @param {string} type of the parser for get.
   * @return {ContentParser} if parser of requested type is found or
   * <code>null</code> otherwise.
   */
  get(type) {
    return this.parsers[type];
  }

  /**
   * Maps provided parsers by their supported content type.
   *
   * @private
   * @param {ContentParser[]} parsers provided with the constructor.
   */
  init(parsers) {
    parsers.forEach((parser) => {
      this.parsers[parser.getSupportedType()] = parser;
    });
  }

  /**
   * @private
   * @param {ContentParser[]} parsers
   */
  validateParsers(parsers) {
    parsers.forEach((parser) => {
      ParserRegistry.validateParser(parser);
    });
  }

  /**
   * @private
   * @param {ContentParser} parser to be validated
   * @throws {Error} if the provided parser is not implementing
   * {@link ContentParser} or has not supported type
   */
  static validateParser(parser) {
    if (!parser || !(parser instanceof ContentParser)) {
      throw new Error('Parser is not provided or does not implement' +
        ' ContentParser!');
    }
    if (!parser.getSupportedType()) {
      throw new Error('Parser type is mandatory parameter!');
    }
  }
}

module.exports = ParserRegistry;
