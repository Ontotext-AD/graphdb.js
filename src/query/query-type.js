/**
 * Supported RDF query types.
 *
 * @readonly
 * @enum {string}
 * @author Mihail Radkov
 * @author Svilen Velikov
 */
const QueryType = {
  SELECT: 'SELECT',
  CONSTRUCT: 'CONSTRUCT',
  DESCRIBE: 'DESCRIBE',
  ASK: 'ASK'
};

module.exports = QueryType;
