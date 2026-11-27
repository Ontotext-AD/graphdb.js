const ContentParser = require('../parser/content-parser');
const RDFMimeType = require('../http/rdf-mime-type');
const TermConverter = require('../model/term-converter');
const N3 = require('n3');
const {DataFactory} = N3;
const {namedNode, blankNode, literal, quad} = DataFactory;

const BLANK_NODE_PREFIX = '_:';
const XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string';

/**
 * Parse RDF/JSON data to Quad objects.
 *
 * Triple terms that GraphDB 12 returns as <code>urn:rdf4j:tripleTerm:</code>
 * IRIs are converted to Quad objects in the object position. RDF/JSON has no
 * named graphs, so all quads are in the default graph.
 *
 * @class
 */
class RDFJsonParser extends ContentParser {
  /**
   * @inheritDoc
   * @param {string|Buffer|Object} content the RDF/JSON document, or the already
   * parsed document, which axios returns for JSON responses
   * @return {Quad[]} the quads of the document
   */
  parse(content) {
    const document = this.toDocument(content);
    return Object.entries(document).flatMap(([subject, predicates]) =>
      Object.entries(predicates).flatMap(([predicate, objects]) =>
        objects.map((object) => quad(this.toNode(subject), namedNode(predicate),
          this.toObject(object)))));
  }

  /**
   * @inheritDoc
   */
  getSupportedType() {
    return RDFMimeType.RDF_JSON;
  }

  /**
   * @private
   * @param {string|Buffer|Object} content the RDF/JSON document
   * @return {Object} the parsed document
   */
  toDocument(content) {
    if (typeof content === 'string' || Buffer.isBuffer(content)) {
      return JSON.parse(content.toString());
    }
    return content;
  }

  /**
   * @private
   * @param {string} id a subject or a blank node identifier, which starts with
   * <code>_:</code> for blank nodes
   * @return {BlankNode|NamedNode} the node as a term
   */
  toNode(id) {
    if (id.startsWith(BLANK_NODE_PREFIX)) {
      return blankNode(id.substring(BLANK_NODE_PREFIX.length));
    }
    return namedNode(id);
  }

  /**
   * @private
   * @param {{type: string, value: string, lang: string, datatype: string}} object
   * the RDF/JSON object
   * @return {Term} the object as a term
   */
  toObject({type, value, lang, datatype}) {
    if (type === 'literal') {
      if (lang) {
        return literal(value, lang);
      }
      return literal(value, namedNode(datatype || XSD_STRING));
    }
    if (type === 'bnode') {
      return this.toNode(value);
    }
    return TermConverter.parseTripleTerm(TermConverter.fromBase64TripleTerm(value)) ||
      namedNode(value);
  }
}

module.exports = RDFJsonParser;
