/**
 * Supported query content types.
 *
 * @readonly
 * @enum {string}
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
const QueryContentType = {
  X_WWW_FORM_URLENCODED: 'application/x-www-form-urlencoded',
  SPARQL_UPDATE: 'application/sparql-update',
  SPARQL_QUERY: 'application/sparql-query'
};

module.exports = QueryContentType;
