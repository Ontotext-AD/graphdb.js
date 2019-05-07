/**
 * Supported RDF mime types.
 * @readonly
 * @enum {string}
 */
const RDFMimeType = {

  // MIME types for RDF formats
  RDF_XML: 'application/rdf+xml',
  N_TRIPLES: 'text/plain',
  TURTLE: 'text/turtle',
  N3: 'text/rdf+n3',
  N_QUADS: 'text/x-nquads',
  JSON_LD: 'application/ld+json',
  RDF_JSON: 'application/rdf+json',
  TRIX: 'application/trix',
  TRIG: 'application/x-trig',
  BINARY_RDF: 'application/x-binary-rdf',

  // MIME types for variable binding formats
  SPARQL_RESULTS_XML: 'application/sparql-results+xml',
  SPARQL_RESULTS_JSON: 'application/sparql-results+json',
  BINARY_RDF_RESULTS_TABLE: 'application/x-binary-rdf-results-table',

  // MIME typE for boolean result formats
  BOOLEAN_RESULT: 'text/boolean'

};

module.exports = RDFMimeType;
