const QueryPayload = require('query/query-payload');
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
   * @return {GetQueryPayload}
   */
  setOffset(offset) {
    if (typeof offset !== 'number' || offset < 0) {
      throw new Error('Offset must be a positive number!');
    }

    this.payload.offset = offset;
    return this;
  }

  /**
   * @inheritDoc
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

  // -----------------------------------------------------
  // Configuration properties get/set methods follow below
  // -----------------------------------------------------

  /**
   * A mandatory parameter which is used for resolving the Accept http header
   * required by the RDF store.
   *
   * @param {string} responseType
   * @return {GetQueryPayload}
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
