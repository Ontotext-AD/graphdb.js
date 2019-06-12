const QueryPayload = require('../query/query-payload');
const QueryContentType = require('../http/query-content-type');

const UPDATE_QUERY_OPERATION_TYPES = [
  QueryContentType.X_WWW_FORM_URLENCODED,
  QueryContentType.SPARQL_UPDATE
];

/**
 * Payload object holding common request parameters applicable for the
 * statements endpoint with a sparql update query.
 *
 * The query is mandatory parameter.
 *
 * Content type parameter which is used for setting the Content-Type http header
 * is optional and by default
 * <code>application/sparql-update</code> type is set.
 *
 * @class
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
class UpdateQueryPayload extends QueryPayload {
  /**
   * Constructs this payload class.
   */
  constructor() {
    super();
    this.contentType = QueryContentType.SPARQL_UPDATE;
  }

  /**
   * @param {string} query The query as string to be evaluated.
   * @return {UpdateQueryPayload}
   */
  setQuery(query) {
    if (typeof query !== 'string') {
      throw new Error('Query must be a string!');
    }

    this.payload.update = query;
    return this;
  }

  /**
   * @return {string} a query which was populated in the payload.
   */
  getQuery() {
    return this.payload.update;
  }

  /**
   * One or more named graph URIs to be used as default graph(s) for retrieving.
   * @param {(string|string[])} [defaultGraphs]
   * @return {UpdateQueryPayload}
   */
  setDefaultGraphs(defaultGraphs) {
    this.payload['using-graph-uri'] = defaultGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Default graphs for the query for retrieving.
   */
  getDefaultGraphs() {
    return this.payload['using-graph-uri'];
  }

  /**
   * One or more named graph URIs to be used as named graph(s) for retrieving.
   * @param {(string|string[])} [namedGraphs]
   * @return {UpdateQueryPayload}
   */
  setNamedGraphs(namedGraphs) {
    this.payload['using-named-graph-uri'] = namedGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Named graphs set for the query for retrieving.
   */
  getNamedGraphs() {
    return this.payload['using-named-graph-uri'];
  }

  /**
   * One or more default graphs for removing statements.
   * @param {(string|string[])} [removeGraphs]
   * @return {UpdateQueryPayload}
   */
  setRemoveGraphs(removeGraphs) {
    this.payload['remove-graph-uri'] = removeGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Default graphs set for the query for removing.
   */
  getRemoveGraphs() {
    return this.payload['remove-graph-uri'];
  }

  /**
   * One or more default graphs for inserting statements.
   * @param {(string|string[])} [insertGraphs]
   * @return {UpdateQueryPayload}
   */
  setInsertGraphs(insertGraphs) {
    this.payload['insert-graph-uri'] = insertGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Default graphs set for the query for inserting.
   */
  getInsertGraphs() {
    return this.payload['insert-graph-uri'];
  }
  /**
   * @inheritDoc
   */
  validateParams() {
    if (!this.payload.update) {
      throw new Error('Parameter query is mandatory!');
    }
    return true;
  }

  /**
   * @inheritDoc
   */
  getSupportedContentTypes() {
    return UPDATE_QUERY_OPERATION_TYPES;
  }
}

module.exports = UpdateQueryPayload;
