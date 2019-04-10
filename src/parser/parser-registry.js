/**
 * Implementation of registry holding {@link ContentTypeParser} instances and
 * providing interface for registering and access.
 * @class
 */
export class ParserRegistry {
  /**
   * @param {Map<string, ContentTypeParser>} parsers
   */
  constructor(parsers) {
    this.parsers = parsers;
  }
}
