const ContentTypeParser = require('parser/content-type-parser');
const RdfContentType = require('http/rdf-content-type');
const Parser = require('n3').Parser;

/**
 * Parse turtle data to triple/quads
 * @class
 */
class TurtleParser extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  constructor(isDefault) {
    super(isDefault);

    this.parser = new Parser({
      format: this.getSupportedType()
    });
  }

  /**
   * @inheritDoc
   */
  parse(content) {
    return this.parser.parse(content);
  }

  /**
   * @inheritDoc
   */
  getSupportedType() {
    return RdfContentType.TURTLE;
  }
}

module.exports = TurtleParser;
