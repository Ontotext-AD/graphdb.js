const ContentTypeParser = require('../parser/content-type-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const Parser = require('n3').Parser;

/**
 * Parse N-Triples data to triple/quads
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class NTriplesParser extends ContentTypeParser {
  /**
   * @inheritDoc
   */
  constructor(isDefault) {
    super(isDefault);

    this.parser = new Parser({
      // Not using the supported type as it is text/plain which is the default
      // content type supported by the repository but is not recognizable from
      // N3 library.
      format: 'N-Triples'
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
    return RDFMimeType.N_TRIPLES;
  }
}

module.exports = NTriplesParser;
