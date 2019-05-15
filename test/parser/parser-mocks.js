const ContentTypeParser = require('parser/content-type-parser');

/**
 * An unsupported parser.
 */
class UnsupportedParser {
}

/**
 * Parser which does not comply whith the API.
 */
class ParserWhichDoesNotImplementTheAPI extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  parse(content) {
    return null;
  }
}

class ParserWhichDoesNotProvideSupportedType extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  getSupportedType() {
    return null;
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
  UnsupportedParser,
  ParserWhichDoesNotImplementTheAPI,
  ParserWhichDoesNotProvideSupportedType,
  RdfAsXmlParser,
  RdfAsJsonParser,
  AnotherRdfAsJsonParser,
  ParserWithNoParseMethod,
  ParserWithNoGetSupportedTypeMethod
};
