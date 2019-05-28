const QueryPayload = require('../query/query-payload');
const QueryType = require('../query/query-type');
const QueryLanguage = require('../query/query-language');
const RDFMimeType = require('../http/rdf-mime-type');
const QueryContentType = require('../http/query-content-type');

const SELECT_QUERY_RESULT_TYPES = [
  RDFMimeType.SPARQL_RESULTS_XML,
  RDFMimeType.SPARQL_RESULTS_JSON,
  RDFMimeType.BINARY_RDF_RESULTS_TABLE,
  RDFMimeType.BOOLEAN_RESULT
];

const ASK_QUERY_RESULT_TYPES = [
  RDFMimeType.SPARQL_RESULTS_XML,
  RDFMimeType.SPARQL_RESULTS_JSON,
  RDFMimeType.BOOLEAN_RESULT
];

const RDF_FORMATS = [
  RDFMimeType.RDF_XML,
  RDFMimeType.N_TRIPLES,
  RDFMimeType.TURTLE,
  RDFMimeType.N3,
  RDFMimeType.N_QUADS,
  RDFMimeType.JSON_LD,
  RDFMimeType.RDF_JSON,
  RDFMimeType.TRIX,
  RDFMimeType.TRIG,
  RDFMimeType.BINARY_RDF
];

const QUERY_OPERATION_TYPES = [
  QueryContentType.X_WWW_FORM_URLENCODED,
  QueryContentType.SPARQL_QUERY
];

const QUERY_TO_RESPONSE_TYPE_FORMATS_MAPPING = {
  SELECT: SELECT_QUERY_RESULT_TYPES,
  DESCRIBE: RDF_FORMATS,
  CONSTRUCT: RDF_FORMATS,
  ASK: ASK_QUERY_RESULT_TYPES
};

/**
 * Payload object holding common request parameters applicable for the query
 * endpoint.
 *
 * Mandatory parameters are: query, queryType and responseType. Validation on
 * parameters is executed when <code>QueryPayload.getParams()</code> is invoked.
 *
 * Content type parameter which is used for setting the Content-Type http header
 * is optional and by default
 * <code>application/x-www-form-urlencoded</code> type is set.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class GetQueryPayload extends QueryPayload {
  /**
   * @inheritDoc
   */
  constructor() {
    super();
    this.contentType = QueryContentType.X_WWW_FORM_URLENCODED;
  }

  /**
   * @param {string} query The query as string to be evaluated.
   * @return {UpdateQueryPayload}
   * @throws {Error} if the query is not a string
   */
  setQuery(query) {
    if (typeof query !== 'string') {
      throw new Error('Query must be a string!');
    }

    this.payload.query = query;
    return this;
  }

  /**
   * @return {string} a query which was populated in the payload.
   */
  getQuery() {
    return this.payload.query;
  }

  /**
   * @param {string} [queryLn] the query language that is used for the query.
   * @return {GetQueryPayload}
   * @throws {Error} if the query language is not one of {@link QueryLanguage}
   */
  setQueryLn(queryLn) {
    const supportedLanguages = Object.values(QueryLanguage);
    if (typeof queryLn !== 'string' ||
      supportedLanguages.indexOf(queryLn) === -1) {
      throw new Error(`Query language must be one of ${supportedLanguages}!`);
    }

    this.payload.queryLn = queryLn;
    return this;
  }

  /**
   * Populates an optional $key:value binding in the payload. Existing bindings
   * will be overridden.
   *
   * @param {string} [binding] A variable binding name which may appear in the
   *                 query and can be bound to a specific value provided outside
   *                 of the actual query.
   * @param {string} [value] A variable's binding value. See the binding comment
   * @return {GetQueryPayload}
   * @throws {Error} if the binding or the value is not a string
   */
  addBinding(binding, value) {
    if (typeof binding !== 'string' || typeof value !== 'string') {
      throw new Error('Binding and value must be strings!');
    }

    this.payload[binding] = value;
    return this;
  }

  /**
   * @param {boolean} [distinct] Specifies if only distinct query solutions
   *                  should be returned.
   * @return {GetQueryPayload}
   * @throws {Error} if the parameter is not a boolean
   */
  setDistinct(distinct) {
    if (typeof distinct !== 'boolean') {
      throw new Error('Distinct must be a boolean!');
    }

    this.payload.distinct = distinct;
    return this;
  }

  /**
   * @param {number} limit specifies the maximum number of query solutions to
   *                 return.
   * @return {GetQueryPayload}
   * @throws {Error} if the limit is not a non negative number
   */
  setLimit(limit) {
    if (typeof limit !== 'number' || limit < 0) {
      throw new Error('Limit must be a non negative number!');
    }

    this.payload.limit = limit;
    return this;
  }

  /**
   * @param {number} [offset] Specifies the number of query solutions to skip.
   * @return {GetQueryPayload}
   * @throws {Error} if the offset is not a non negative number
   */
  setOffset(offset) {
    if (typeof offset !== 'number' || offset < 0) {
      throw new Error('Offset must be a non negative number!');
    }

    this.payload.offset = offset;
    return this;
  }

  /**
   * @inheritDoc
   * @throws {Error} if the validation does not pass
   */
  validateParams() {
    if (!this.payload.query) {
      throw new Error('Parameter query is mandatory!');
    }
    if (!this.getQueryType()) {
      throw new Error('Parameter queryType is mandatory!');
    }
    if (!this.getResponseType()) {
      throw new Error('Parameter responseType is mandatory!');
    }

    const responseType = this.getResponseType();

    const allowedFormats =
      QUERY_TO_RESPONSE_TYPE_FORMATS_MAPPING[this.getQueryType()];

    if (!this.isResponseTypeSupported(responseType, allowedFormats)) {
      throw new Error(`Invalid responseType=${responseType} 
      for ${this.getQueryType()} query! Must be one of ${allowedFormats}`);
    }

    return true;
  }

  /**
   * Verifies that responseType is one of the expected types.
   *
   * @private
   * @param {string} responseType
   * @param {Array<string>} formats
   * @return {boolean} true if responseType is one of the expected types and
   * false otherwise.
   */
  isResponseTypeSupported(responseType, formats) {
    return formats.indexOf(responseType) !== -1;
  }

  // -----------------------------------------------------
  // Configuration properties get/set methods follow below
  // -----------------------------------------------------

  /**
   * A mandatory parameter which is used for resolving the Accept http header
   * required by the RDF store.
   *
   * @param {string} responseType
   * @return {GetQueryPayload}
   * @throws {Error} if the response type is not one of {@link RDFMimeType}
   */
  setResponseType(responseType) {
    const supportedTypes = Object.values(RDFMimeType);
    if (typeof responseType !== 'string' ||
      supportedTypes.indexOf(responseType) === -1) {
      throw new Error(`Response type must be one of ${supportedTypes}!`);
    }

    this.responseType = responseType;
    return this;
  }

  /**
   * @return {string} response type which was populated in this payload.
   */
  getResponseType() {
    return this.responseType;
  }

  /**
   * A mandatory parameter used for resolving request headers and resolving
   * the response parsers.
   *
   * @param {QueryType} queryType
   * @return {GetQueryPayload}
   * @throws {Error} if the query type is not one of {@link QueryType}
   */
  setQueryType(queryType) {
    const supportedTypes = Object.values(QueryType);
    if (typeof queryType !== 'string' ||
      supportedTypes.indexOf(queryType) === -1) {
      throw new Error(`Query type must be one of ${supportedTypes}!`);
    }

    this.queryType = queryType;
    return this;
  }

  /**
   * @return {string} query type which was populated in this payload. The value
   * is one of the {@link QueryType} enum values.
   */
  getQueryType() {
    return this.queryType;
  }

  /**
   * @inheritDoc
   */
  getSupportedContentTypes() {
    return QUERY_OPERATION_TYPES;
  }
}

module.exports = GetQueryPayload;
