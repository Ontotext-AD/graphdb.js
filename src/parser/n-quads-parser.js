const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const Parser = require('n3').Parser;

/**
 * Parse N-Quads data to triple/quads
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class NQuadsParser extends ContentParser {
  /**
   * @inheritDoc
   */
  constructor(config) {
    super(config);

    this.parser = new Parser({
      format: this.getSupportedType()
    });
  }

  /**
   * @inheritDoc
   */
  parse(content, config) {
    return this.parser.parse(content);
  }

  /**
   * @inheritDoc
   */
  getSupportedType() {
    return RDFMimeType.N_QUADS;
  }
}

module.exports = NQuadsParser;
