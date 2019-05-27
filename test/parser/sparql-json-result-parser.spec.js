const SparqlJsonResultParser = require('parser/sparql-json-result-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('SparqlJsonResultParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new SparqlJsonResultParser().parser).toBeDefined();
  });

  test('should be configured with the N3 DataFactory by default', () => {
    // N3 DataFactory exposed its internal API as well, not only the functions
    expect(new SparqlJsonResultParser().parser.dataFactory.internal).toBeDefined();
  });

  test('should set isDefault if provided to constructor', () => {
    let parserInstance = new SparqlJsonResultParser();
    expect(parserInstance.isDefault()).toBeFalsy();
    parserInstance = new SparqlJsonResultParser(true);
    expect(parserInstance.isDefault()).toBeTruthy();
  });

  test('should return supported type', () => {
    expect(new SparqlJsonResultParser().getSupportedType()).toEqual(RDFMimeType.SPARQL_RESULTS_JSON);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new SparqlJsonResultParser();
    parserInstance.parser.parseJsonResultsStream = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parseJsonResultsStream).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parseJsonResultsStream).toHaveBeenCalledWith('content');
  });
});
