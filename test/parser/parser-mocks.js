const ContentParser = require('parser/content-parser');

/**
 * An unsupported parser.
 */
class UnsupportedParser {
}

/**
 * Parser which does not comply whith the API.
 */
class ParserWhichDoesNotImplementTheAPI extends ContentParser {
  /**
   * @inheritDoc
   */
  parse(content) {
    return null;
  }
}

class ParserWhichDoesNotProvideSupportedType extends ContentParser {
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
class RdfAsXmlParser extends ContentParser {
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
class RdfAsJsonParser extends ContentParser {
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
class AnotherRdfAsJsonParser extends ContentParser {
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
class ParserWithNoParseMethod extends ContentParser {
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
class ParserWithNoGetSupportedTypeMethod extends ContentParser {
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
