/**
 * Supported RDF query types.
 * @readonly
 * @enum {string}
 */
const QueryType = {
  SELECT: 'SELECT',
  CONSTRUCT: 'CONSTRUCT',
  DESCRIBE: 'DESCRIBE',
  ASK: 'ASK'
};

module.exports = QueryType;
