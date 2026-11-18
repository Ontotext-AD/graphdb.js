const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const Parser = require('n3').Parser;

/**
 * Parse N-Triples data to triple/quads
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class NTriplesParser extends ContentParser {
  /**
   * @param {Object} config is an object containing the parser configuration.
   */
  constructor(config) {
    super(config);

    this.parser = new Parser({
      format: 'N-Triples',
      allowTripleTerms: true
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
    return RDFMimeType.N_TRIPLES;
  }
}

module.exports = NTriplesParser;
