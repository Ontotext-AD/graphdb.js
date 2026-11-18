const N3 = require('n3');
const {DataFactory} = N3;
const {namedNode, literal, quad, blankNode, variable} = DataFactory;
const StringUtils = require('../util/string-utils');
const ENCODED_RDFSTAR_TRIPLE_PREFIX = 'urn:rdf4j:triple:';
const ENCODED_TRIPLE_TERM_PREFIX = 'urn:rdf4j:tripleTerm:';
const XSD_PREFIX = 'xsd:';
const XSD_NAMESPACE = 'http://www.w3.org/2001/XMLSchema#';

/**
 * Utility class for converting strings to terms, terms to quads and
 * quads to string according to the {@link https://rdf.js.org} specification.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 * @author Teodossi Dossev
 */
class TermConverter {
  /**
   * Convert the supplied params to a collection of quads.
   *
   * The produced quads size depends on the supplied amount of context.
   *
   * @public
   * @static
   * @param {string} subject the quad's subject
   * @param {string} predicate the quad's predicate
   * @param {string} object the quad's object
   * @param {(string|string[])} [contexts] the quad's context
   * @return {Quad[]} a collection of quads constructed from the provided params
   */
  static getQuads(subject, predicate, object, contexts) {
    const objectTerm = TermConverter.toObject(object);
    return TermConverter.toQuads(subject, predicate, objectTerm, contexts);
  }

  /**
   * Convert the supplied params to a collection of quads.
   *
   * The quads object term will be a literal with a data type or a language.
   *
   * The produced quads size depends on the supplied amount of context.
   *
   * @public
   * @static
   * @param {string} subject the quad's subject
   * @param {string} predicate the quad's predicate
   * @param {string} object the quad's object
   * @param {(string|string[])} [contexts] the quad's context
   * @param {string} type the quad's data type
   * @param {string} language the quad's literal language
   * @return {Quad[]} a collection of quads constructed from the provided params
   */
  static getLiteralQuads(subject, predicate, object, contexts, type, language) {
    let objectTerm;
    if (language) {
      objectTerm = TermConverter.toObjectWithLanguage(object, language);
    } else {
      objectTerm = TermConverter.toObjectWithDataType(object, type);
    }
    return TermConverter.toQuads(subject, predicate, objectTerm, contexts);
  }

  /**
   * Convert the supplied params to terms and then to a collection of quads.
   * The supplied object should already be converted to a term.
   *
   * The produced quads size depends on the supplied amount of context.
   *
   * @private
   * @static
   * @param {string} subject the quad's subject
   * @param {string} predicate the quad's predicate
   * @param {Term} objectTerm the quads object already converted to a Term
   * @param {(string|string[])} contexts the quad's context
   * @return {Quad[]} collection of quads constructed from the provided params
   */
  static toQuads(subject, predicate, objectTerm, contexts) {
    const subjectTerm = TermConverter.toSubject(subject);
    const predicateTerm = TermConverter.toPredicate(predicate);
    const contextTerms = TermConverter.toGraphs(contexts);

    if (contextTerms && contextTerms.length) {
      return contextTerms.map((graph) => quad(subjectTerm, predicateTerm,
        objectTerm, graph));
    }
    return [quad(subjectTerm, predicateTerm, objectTerm)];
  }

  /**
   * Serializes the provided collection of quads to Turtle format or Trig in
   * case any of the quads have context.
   *
   * @public
   * @static
   * @param {Quad[]} quads the collection of quads to serialize to Turtle
   * @return {string} a promise that will be resolved to Turtle or Trig
   * text or rejected if the quads cannot be serialized
   */
  static toString(quads) {
    const writer = TermConverter.getWriter();
    writer.addQuads(quads);

    let converted = '';
    writer.end((error, result) => {
      if (error) {
        throw new Error(error);
      } else {
        converted = result.trim();
      }
    });
    return converted;
  }

  /**
   * Converts the provided value to N-Triple encoded value in case it is not
   * already one or a literal value.
   *
   * For example:
   * <ul>
   *   <li><i>http://resource</i> encodes to <i><http://resource></i></li>
   *   <li><i>"Literal title"@en</i> will not be encoded</li>
   *   <li><i><http://resource></i> encodes to the same value</li>
   * </ul>
   *
   * Empty or null values are ignored.
   *
   * @public
   * @static
   * @param {string} value the value for converting
   * @return {string} the converted value to N-Triple
   */
  static toNTripleValue(value) {
    if (StringUtils.isNotBlank(value)) {
      if (value.startsWith('"')) {
        // Do not convert literals
        return value;
      }
      if (value.startsWith('<')) {
        // Value is probably already encoded as N-Triple
        return value;
      }
      return `<${value}>`;
    }
  }

  /**
   * Converts the provided values to N-Triple encoded values in case they are
   * not already one or literal values.
   *
   * Empty or null values are ignored.
   *
   * @see {@link #toNTripleValue}

   * @public
   * @static
   * @param {string|string[]} values the values for converting
   * @return {string|string[]} the converted value or values to N-Triple
   */
  static toNTripleValues(values) {
    if (values instanceof Array) {
      return values
        .filter((value) => StringUtils.isNotBlank(value))
        .map((value) => TermConverter.toNTripleValue(value));
    }
    return TermConverter.toNTripleValue(values);
  }

  /**
   * Converts the provided subject string to a specific Term based on the value.
   *
   * @private
   * @param {string} value the subject to convert
   * @return {BlankNode|Variable|NamedNode} the provided subject as Term
   */
  static toSubject(value) {
    return TermConverter.toTerm(value);
  }

  /**
   * Converts the provided predicate string to a specific Term based on the
   * value.
   *
   * @private
   * @param {string} value the predicate to convert
   * @return {Variable|NamedNode} the provided predicate as Term
   */
  static toPredicate(value) {
    if (TermConverter.isVariable(value)) {
      return TermConverter.toVariable(value);
    }
    return namedNode(value);
  }

  /**
   * Converts the provided object string to a specific Term based on the value.
   *
   * This is not handling literal strings. For that use
   * {@link TermConverter#toObjectWithLanguage} or
   * {@link TermConverter#toObjectWithDataType}
   *
   * @private
   * @param {string} value the object to convert
   * @return {BlankNode|Variable|NamedNode} the provided object as Term
   */
  static toObject(value) {
    // Same as subject (when it is not literal)
    return TermConverter.toSubject(value);
  }

  /**
   * Converts the provided object and language to a Literal term.
   *
   * @private
   * @param {string} object the value to convert
   * @param {string} language the object's language
   * @return {Literal} the provided object as Literal
   */
  static toObjectWithLanguage(object, language) {
    return literal(object, language);
  }

  /**
   * Converts the provided object and data type to a Literal term.
   *
   * @private
   * @param {string} object the value to convert
   * @param {string} dataType the object's type
   * @return {Literal} the provided object as Literal
   */
  static toObjectWithDataType(object, dataType) {
    return literal(object, namedNode(TermConverter.expandXsdPrefix(dataType)));
  }

  /**
   * Expands the <code>xsd:</code> prefix of the provided data type to the XSD
   * namespace. Any other data type is returned as is.
   *
   * @private
   * @param {string} dataType the data type to expand
   * @return {string} the data type as a full IRI
   */
  static expandXsdPrefix(dataType) {
    if (dataType.startsWith(XSD_PREFIX)) {
      return XSD_NAMESPACE + dataType.substring(XSD_PREFIX.length);
    }
    return dataType;
  }

  /**
   * Converts the provided context to a collection of Term.
   *
   * The produced terms size depends on the supplied amount of context.
   *
   * @private
   * @param {string|string[]} [contexts] the contexts to convert
   * @return {Term[]} the provided contexts as Terms
   */
  static toGraphs(contexts) {
    if (!contexts || (contexts.length && contexts.length < 1)) {
      return [];
    }
    // Convert to array
    if (!(contexts instanceof Array)) {
      contexts = [contexts];
    }
    // Convert to terms
    return contexts.map((context) => TermConverter.toTerm(context));
  }

  /**
   * Converts the provided string to a specific Term based on the value.
   *
   * <ul>
   *  <li>If the string begins with <code>_:</code> it will be converted to a
   *  blank node term.</li>
   *  <li>If the string begins with <code>?</code> it will be converted to a
   *  variable term.</li>
   *  <li>Otherwise it will be converted a simple named node term.</li>
   * </ul>
   *
   * @private
   * @param {string} value the string to convert
   * @return {BlankNode|Variable|NamedNode} the provided value as Term
   */
  static toTerm(value) {
    if (TermConverter.isBlankNode(value)) {
      // Trim leading _:
      return blankNode(value.substring(2));
    }
    if (TermConverter.isVariable(value)) {
      return TermConverter.toVariable(value);
    }
    return namedNode(value);
  }

  /**
   * Returns a variable term from the provided value without leading ?
   *
   * @private
   * @param {string} value the value to convert to variable
   * @return {Variable} the produced variable
   */
  static toVariable(value) {
    // Trim leading ?
    return variable(value.substring(1));
  }

  /**
   * Checks if the provided value is a blank node.
   *
   * Blank nodes are such values that start with <code>_:</code> prefix
   *
   * @private
   * @param {string} value the value to check
   * @return {boolean} <code>true</code> if the value is a blank node
   *                    or <code>false</code> otherwise
   */
  static isBlankNode(value) {
    return value.startsWith('_:');
  }

  /**
   * Checks if the provided value is a variable.
   *
   * Variables are such values that start with <code>?</code> prefix
   *
   * @private
   * @param {string} value the value to check
   * @return {boolean} <code>true</code> if the value is a variable
   *                    or <code>false</code> otherwise
   */
  static isVariable(value) {
    return value.startsWith('?');
  }

  /**
   * Instantiates new N3 writer for quads.
   *
   * This writer is not reusable, after invoking <code>end()</code> it won't
   * allow further quads insertions.
   *
   * @private
   * @return {N3.Writer} new writer for quads
   */
  static getWriter() {
    return new N3.Writer();
  }

  /**
   * Decodes a Base64url triple term with the
   * <code>urn:rdf4j:tripleTerm:</code> prefix returned by GraphDB 12, or with
   * the <code>urn:rdf4j:triple:</code> prefix returned by GraphDB 11.
   *
   * @param {string} encodedTriple to be decoded from base64 url string
   * @return {string} decoded triple, returns unchanged if the provided
   * triple is not in the expected format
   */
  static fromBase64TripleTerm(encodedTriple) {
    const prefixes = [
      ENCODED_RDFSTAR_TRIPLE_PREFIX,
      ENCODED_TRIPLE_TERM_PREFIX
    ];
    const prefix = prefixes.find((p) => encodedTriple.startsWith(p));
    if (prefix) {
      const payload = encodedTriple.slice(prefix.length);
      return Buffer.from(payload, 'base64url').toString('utf8');
    }
    return encodedTriple;
  }

  /**
   * Encodes a triple term to a Base64url string with the
   * <code>urn:rdf4j:tripleTerm:</code> prefix.
   *
   * @param {string} triple the triple term to encode
   * @return {string} the encoded triple term, returns unchanged if the provided
   * value is not in the expected format
   */
  static toBase64TripleTerm(triple) {
    if (triple.startsWith('<<(') && triple.endsWith(')>>')) {
      const encoded = Buffer.from(triple, 'utf8').toString('base64url');
      return ENCODED_TRIPLE_TERM_PREFIX + encoded;
    }
    return triple;
  }

  /**
   * Parses a triple term in the <code><<( s p o )>></code> syntax to a Quad.
   *
   * @param {string} tripleTerm the triple term to parse
   * @return {Quad|null} the triple term as a Quad, or <code>null</code> if the
   * value is not a triple term or cannot be parsed
   */
  static parseTripleTerm(tripleTerm) {
    if (!tripleTerm) {
      return null;
    }

    let content;
    if (tripleTerm.startsWith('<<(') && tripleTerm.endsWith(')>>')) {
      content = tripleTerm.slice(3, -3);
    } else if (tripleTerm.startsWith('<<') && tripleTerm.endsWith('>>')) {
      content = tripleTerm.slice(2, -2);
    } else {
      return null;
    }

    try {
      const quads = new N3.Parser().parse(`${content} .`);
      if (quads.length > 0) {
        return quads[0];
      }
    } catch (e) {
      // Parsing failed, return null
    }
    return null;
  }

  /**
   * @deprecated Use {@link TermConverter#fromBase64TripleTerm} instead.
   * @param {string} encodedTriple the encoded triple term
   * @return {string} the decoded triple term
   */
  static fromBase64RdfStarTriple(encodedTriple) {
    return TermConverter.fromBase64TripleTerm(encodedTriple);
  }

  /**
   * @deprecated Use {@link TermConverter#toBase64TripleTerm} instead.
   * @param {string} triple the triple term to encode
   * @return {string} the encoded triple term
   */
  static toBase64RdfStarTriple(triple) {
    return TermConverter.toBase64TripleTerm(triple);
  }
}

module.exports = TermConverter;
