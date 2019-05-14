const QueryPayload = require('query/query-payload');
const QueryContentType = require('http/query-content-type');

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
