const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const RdfXmlParser = require('rdfxml-streaming-parser').RdfXmlParser;

/**
 * Parse rdfxml data to triple/quads
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class RDFXmlParser extends ContentParser {
  /**
   * @inheritDoc
   */
  constructor(config) {
    super(config);

    this.parser = new RdfXmlParser(this.config);
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
    return RDFMimeType.RDF_XML;
  }

  /**
   * @inheritDoc
   */
  isStreaming() {
    return true;
  }
}

module.exports = RDFXmlParser;
