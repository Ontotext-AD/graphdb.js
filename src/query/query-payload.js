const QueryType = require('query/query-type');
const QueryLanguage = require('query/query-language');
const RDFMimeType = require('http/rdf-mime-type');
const QueryContentType = require('http/query-content-type');

const SELECT_QUERY_RESULT_TYPES = [
  RDFMimeType.SPARQL_RESULTS_XML,
  RDFMimeType.SPARQL_RESULTS_JSON,
  RDFMimeType.BINARY_RDF_RESULTS_TABLE,
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
 */
class QueryPayload {
  /**
   * Constructs this payload class.
   */
  constructor() {
    this.payload = {};
    this.contentType = QueryContentType.X_WWW_FORM_URLENCODED;
  }

  /**
   * @param {string} query The query as string to be evaluated.
   * @return {QueryPayload}
   */
  setQuery(query) {
    if (typeof query !== 'string') {
      throw new Error('Query must be a string!');
    }

    this.payload.query = query;
    return this;
  }

  /**
   * @param {string} [queryLn] the query language that is used for the query.
   * @return {QueryPayload}
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
   * @param {boolean} [inference] Specifies whether inferred statements should
   *                  be included in the query evaluation.
   * @return {QueryPayload}
   */
  setInference(inference) {
    if (typeof inference !== 'boolean') {
      throw new Error('Inference must be a boolean!');
    }

    this.payload.infer = inference;
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
   * @return {QueryPayload}
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
   * @return {QueryPayload}
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
   * @return {QueryPayload}
   */
  setLimit(limit) {
    if (typeof limit !== 'number' || limit < 0) {
      throw new Error('Limit must be a positive number!');
    }

    this.payload.limit = limit;
    return this;
  }

  /**
   * @param {number} [offset] Specifies the number of query solutions to skip.
   * @return {QueryPayload}
   */
  setOffset(offset) {
    if (typeof offset !== 'number' || offset < 0) {
      throw new Error('Offset must be a positive number!');
    }

    this.payload.offset = offset;
    return this;
  }

  /**
   * @param {number} [timeout] Specifies a maximum query execution time, in
   *                 whole seconds.
   * @return {QueryPayload}
   */
  setTimeout(timeout) {
    if (typeof timeout !== 'number') {
      throw new Error('Timeout must be a number!');
    }

    this.payload.timeout = timeout;
    return this;
  }

  /**
   * Serializes all query parameters populated in the payload. Only parameters
   * which are present will be returned.
   *
   * Mandatory and dependent parameters are validated and errors are thrown if
   * necessary.
   *
   * @return {string} a serialized payload which holds all available query
   * parameters in this payload object.
   */
  getParams() {
    // when contentType is 'x-www-form-urlencoded', then all parameters should
    // be considered
    if (this.getContentType() === QueryContentType.X_WWW_FORM_URLENCODED) {
      const isValid = this.validateParams();
      return isValid && this.serialize(this.payload);
    }

    // when contentType is 'sparql-query', then only the query is mandatory and
    // applicable
    const query = this.payload.query;
    if (!query) {
      throw new Error('Parameter query is mandatory!');
    }
    return query;
  }

  /**
   * Validates payload for mandatory and invalid parameters.
   *
   * @private
   * @return {boolean} true if payload is valid.
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

    if (this.getQueryType() === QueryType.SELECT) {
      const isValidType = this.isSelectQueryResultType(responseType);
      if (!isValidType) {
        throw new Error(`Invalid responseType=${responseType} for SELECT query!
         Must be one of ${SELECT_QUERY_RESULT_TYPES}`);
      }
    }

    if (this.getQueryType() === QueryType.CONSTRUCT) {
      const isValidType = this.isConstructQueryResultType(responseType);
      if (!isValidType) {
        throw new Error(`Invalid responseType=${responseType} for CONSTRUCT 
        query! Must be one of ${RDF_FORMATS}`);
      }
    }

    if (this.getQueryType() === QueryType.DESCRIBE) {
      const isValidType = this.isDescribeQueryResultType(responseType);
      if (!isValidType) {
        throw new Error(`Invalid responseType=${responseType} for CONSTRUCT 
        query! Must be one of ${RDF_FORMATS}`);
      }
    }

    if (this.getQueryType() === QueryType.ASK) {
      if (responseType !== RDFMimeType.BOOLEAN_RESULT) {
        throw new Error(`Invalid responseType=${responseType} for ASK query! 
        Must be of ${RDFMimeType.BOOLEAN_RESULT}`);
      }
    }

    return true;
  }

  /**
   * Verifies that responseType is one of the expected types for CONSTRUCT
   * query.
   *
   * @private
   * @param {string} responseType
   * @return {boolean} true if responseType is one of the expected types and
   * false otherwise.
   */
  isConstructQueryResultType(responseType) {
    return RDF_FORMATS.indexOf(responseType) !== -1;
  }

  /**
   * Verifies that responseType is one of the expected types for DESCRIBE query.
   *
   * @private
   * @param {string} responseType
   * @return {boolean} true if responseType is one of the expected types and
   * false otherwise.
   */
  isDescribeQueryResultType(responseType) {
    return RDF_FORMATS.indexOf(responseType) !== -1;
  }

  /**
   * Verifies that responseType is one of the expected types for SELECT query.
   *
   * @private
   * @param {string} responseType
   * @return {boolean} true if responseType is one of the expected types and
   * false otherwise.
   */
  isSelectQueryResultType(responseType) {
    return SELECT_QUERY_RESULT_TYPES.indexOf(responseType)
      !== -1;
  }

  /**
   * Utility method which serializes a json object to properly encoded string
   * that can be used as request body.
   *
   * @param {Object} data object which holds request parameter key:value pairs.
   * @return {string} provided object serialized and encoded to string.
   */
  serialize(data) {
    return Object.entries(data)
      .filter((x) => x[1] !== undefined)
      .map((x) => `${encodeURIComponent(x[0])}=${encodeURIComponent(x[1])}`)
      .join('&');
  }

  // -----------------------------------------------------
  // Configuration properties get/set methods follow below
  // -----------------------------------------------------

  /**
   * A mandatory parameter which is used for resolving the Accept http header
   * required by the RDF store.
   *
   * @param {string} responseType
   * @return {QueryPayload}
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
   * An optional parameter which is used for defining the query Content-Type.
   *
   * Only following content types are supported for query operations:
   * <ul>
   *     <li>application/x-www-form-urlencoded</li>
   *     <li>application/sparql-query</li>
   * </ul>
   *
   * By default <code>application/x-www-form-urlencoded</code> is used.
   *
   * @param {string} [contentType]
   * @return {QueryPayload}
   */
  setContentType(contentType) {
    if (typeof contentType !== 'string' ||
      QUERY_OPERATION_TYPES.indexOf(contentType) === -1) {
      throw new Error(`Content type must be one of ${QUERY_OPERATION_TYPES}!`);
    }

    this.contentType = contentType;
    return this;
  }

  /**
   * @return {string} content type which was populated in this payload.
   */
  getContentType() {
    return this.contentType;
  }

  /**
   * A mandatory parameter used for resolving request headers and resolving
   * the response parsers.
   *
   * @param {QueryType} queryType
   * @return {QueryPayload}
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
}

module.exports = QueryPayload;
