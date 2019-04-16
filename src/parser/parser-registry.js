/**
 * Implementation of registry holding {@link ContentTypeParser} instances and
 * providing interface for registering and access.
 * @class
 */
class ParserRegistry {
  /**
   * @param {Map<string, ContentTypeParser>} parsers
   */
  constructor(parsers) {
    this.parsers = parsers;
  }
}

module.exports = ParserRegistry;
