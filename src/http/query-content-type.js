/**
 * Supported query content types.
 * @readonly
 * @enum {string}
 */
const QueryContentType = {
  X_WWW_FORM_URLENCODED: 'application/x-www-form-urlencoded',
  SPARQL_UPDATE: 'application/sparql-update',
  SPARQL_QUERY: 'application/sparql-query'
};

module.exports = QueryContentType;
