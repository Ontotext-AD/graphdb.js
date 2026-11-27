const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const JsonLdParser = require('jsonld-streaming-parser').JsonLdParser;
const {Transform} = require('stream');
const TermConverter = require('../model/term-converter');
const N3 = require('n3');
const {DataFactory} = N3;
const {quad} = DataFactory;

/**
 * Transform stream that converts encoded triple terms to Quad objects.
 * @class
 * @private
 */
class TripleTermTransform extends Transform {
  /**
   * @constructor
   */
  constructor() {
    super({objectMode: true});
  }

  /**
   * @param {Quad} quadOrTriple
   * @param {string} encoding
   * @param {Function} callback
   * @private
   */
  _transform(quadOrTriple, encoding, callback) {
    try {
      const transformed = this._convertTripleTerms(quadOrTriple);
      callback(null, transformed);
    } catch (error) {
      callback(error);
    }
  }

  /**
   * Convert triple terms encoded as Base64 IRIs to actual Quad objects.
   * @param {Quad} inputQuad
   * @return {Quad}
   * @private
   */
  _convertTripleTerms(inputQuad) {
    if (!inputQuad || !inputQuad.object) {
      return inputQuad;
    }

    const obj = inputQuad.object;
    if (obj.termType === 'NamedNode') {
      const decodedTriple = TermConverter.fromBase64TripleTerm(obj.value);
      const tripleQuad = TermConverter.parseTripleTerm(decodedTriple);
      if (tripleQuad) {
        return quad(inputQuad.subject, inputQuad.predicate, tripleQuad,
          inputQuad.graph);
      }
    }

    return inputQuad;
  }
}

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

    this.parser = new JsonLdParser({...this.config, allowTripleTerms: true});
  }

  /**
   * @inheritDoc
   */
  parse(content, config) {
    const stream = this.parser.import(content);
    if (!stream) {
      return stream;
    }
    const transform = new TripleTermTransform();
    stream.on('error', (error) => transform.destroy(error));
    return stream.pipe(transform);
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
