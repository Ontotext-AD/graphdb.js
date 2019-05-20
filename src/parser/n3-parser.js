const ContentTypeParser = require('../parser/content-type-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const Parser = require('n3').Parser;

/**
 * Parse N3 data to triple/quads
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class N3Parser extends ContentTypeParser {
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
    return RDFMimeType.N3;
  }
}

module.exports = N3Parser;
