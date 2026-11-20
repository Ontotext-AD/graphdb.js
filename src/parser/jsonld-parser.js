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
   * @param {Quad} q
   * @return {Quad}
   * @private
   */
  _convertTripleTerms(q) {
    if (!q || !q.object) {
      return q;
    }

    const obj = q.object;
    if (obj.termType === 'NamedNode' &&
        obj.value.startsWith('urn:rdf4j:triple:')) {
      const decodedTriple = TermConverter.fromBase64RdfStarTriple(obj.value);
      const tripleQuad = this._parseTripleTerm(decodedTriple);
      if (tripleQuad) {
        return quad(q.subject, q.predicate, tripleQuad, q.graph);
      }
    }

    return q;
  }

  /**
   * Parse triple term string to a Quad object.
   * @param {string} tripleStr
   * @return {Quad|null}
   * @private
   */
  _parseTripleTerm(tripleStr) {
    if (!tripleStr) {
      return null;
    }

    let content = tripleStr;
    if (content.startsWith('<<<') && content.endsWith('>>>')) {
      content = content.slice(3, -3);
    } else if (content.startsWith('<<(') && content.endsWith(')>>')) {
      content = content.slice(3, -3);
    } else if (content.startsWith('<<') && content.endsWith('>>')) {
      content = content.slice(2, -2);
    } else {
      return null;
    }

    try {
      const parser = new (require('n3').Parser)({allowTripleTerms: true});
      const quads = parser.parse(`${content} .`);
      if (quads.length > 0) {
        return quads[0];
      }
    } catch (e) {
      // Parsing failed, return null
    }

    return null;
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
    return stream.pipe(new TripleTermTransform());
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
