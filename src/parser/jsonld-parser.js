const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const JsonLdParser = require('jsonld-streaming-parser').JsonLdParser;

/**
 * Parse jsonld data to triple/quads
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class JsonLDParser extends ContentParser {
  /**
   * @param {Object} config is an object containing the parser configuration.
   */
  constructor(config) {
    super(config);

    this.parser = new JsonLdParser(this.config);
  }

  /**
   * @inheritDoc
   */
  parse(content, config) {
    return this.parser.import(content);
  }

  /**
   * @inheritDoc
   */
  getSupportedType() {
    return RDFMimeType.JSON_LD;
  }

  /**
   * @inheritDoc
   */
  isStreaming() {
    return true;
  }
}

module.exports = JsonLDParser;
