const ContentTypeParser = require('parser/content-type-parser');

/**
 * For testing purposes.
 */
class SomeParser {
  /**
   * @return {string}
   */
  getSupportedType() {
    return 'someparser';
  }
}

/**
 * For testing purposes.
 */
class RdfAsXmlParser extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  getSupportedType() {
    return 'application/rdf+xml';
  }

  /**
   * @inheritDoc
   */
  parse(content) {
    return null;
  }
}

/**
 * For testing purposes.
 */
class RdfAsJsonParser extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  getSupportedType() {
    return 'application/rdf+json';
  }

  /**
   * @inheritDoc
   */
  parse(content) {
    return null;
  }
}

/**
 * For testing purposes.
 */
class AnotherRdfAsJsonParser extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  getSupportedType() {
    return 'application/rdf+json';
  }

  /**
   * @inheritDoc
   */
  parse(content) {
    return null;
  }
}

/**
 * For testing purposes.
 */
class ParserWithNoParseMethod extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  getSupportedType() {
    return 'application/rdf+json';
  }
}

/**
 * For testing purposes.
 */
class ParserWithNoGetSupportedTypeMethod extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  parse(content) {
    return null;
  }
}

module.exports = {
  SomeParser,
  RdfAsXmlParser,
  RdfAsJsonParser,
  AnotherRdfAsJsonParser,
  ParserWithNoParseMethod,
  ParserWithNoGetSupportedTypeMethod
};
