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
 * The content type parameter, which is used for setting the HTTP Content-Type
 * header, can be one of the following:
 *  - <code>application/x-www-form-urlencoded</code>
 *  - <code>application/sparql-update</code>
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
   * One or more named graph URIs to be used as default graph(s) for retrieving.
   * @param {(string|string[])} [defaultGraphs]
   * @return {UpdateQueryPayload}
   */
  setDefaultGraphs(defaultGraphs) {
    this.params['using-graph-uri'] = defaultGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Default graphs for the query for retrieving.
   */
  getDefaultGraphs() {
    return this.params['using-graph-uri'];
  }

  /**
   * One or more named graph URIs to be used as named graph(s) for retrieving.
   * @param {(string|string[])} [namedGraphs]
   * @return {UpdateQueryPayload}
   */
  setNamedGraphs(namedGraphs) {
    this.params['using-named-graph-uri'] = namedGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Named graphs set for the query for retrieving.
   */
  getNamedGraphs() {
    return this.params['using-named-graph-uri'];
  }

  /**
   * One or more default graphs for removing statements.
   * @param {(string|string[])} [removeGraphs]
   * @return {UpdateQueryPayload}
   */
  setRemoveGraphs(removeGraphs) {
    this.params['remove-graph-uri'] = removeGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Default graphs set for the query for removing.
   */
  getRemoveGraphs() {
    return this.params['remove-graph-uri'];
  }

  /**
   * One or more default graphs for inserting statements.
   * @param {(string|string[])} [insertGraphs]
   * @return {UpdateQueryPayload}
   */
  setInsertGraphs(insertGraphs) {
    this.params['insert-graph-uri'] = insertGraphs;
    return this;
  }

  /**
   * @return {(string|string[])} Default graphs set for the query for inserting.
   */
  getInsertGraphs() {
    return this.params['insert-graph-uri'];
  }

  /**
   * @inheritDoc
   */
  getSupportedContentTypes() {
    return UPDATE_QUERY_OPERATION_TYPES;
  }
}

module.exports = UpdateQueryPayload;
