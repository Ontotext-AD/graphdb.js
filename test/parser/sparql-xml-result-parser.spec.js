const SparqlXmlResultParser = require('parser/sparql-xml-result-parser');
const RDFMimeType = require('http/rdf-mime-type');
const QueryType = require('query/query-type');

describe('SparqlXmlResultParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new SparqlXmlResultParser().parser).toBeDefined();
  });

  test('should be configured with the N3 DataFactory by default', () => {
    // N3 DataFactory exposed its internal API as well, not only the functions
    expect(new SparqlXmlResultParser().parser.dataFactory.internal).toBeDefined();
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new SparqlXmlResultParser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new SparqlXmlResultParser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should return supported type', () => {
    expect(new SparqlXmlResultParser().getSupportedType()).toEqual(RDFMimeType.SPARQL_RESULTS_XML);
  });

  test('should invoke underlying parser for test stream result parsing', () => {
    const parserInstance = new SparqlXmlResultParser();
    parserInstance.parser.parseXmlResultsStream = jest.fn();
    parserInstance.parse('content', {queryType: QueryType.SELECT});
    expect(parserInstance.parser.parseXmlResultsStream).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parseXmlResultsStream).toHaveBeenCalledWith('content');
  });

  test('should invoke underlying parser for boolean stream result parsing', () => {
    const parserInstance = new SparqlXmlResultParser();
    parserInstance.parser.parseXmlBooleanStream = jest.fn();
    parserInstance.parse('content', {queryType: QueryType.ASK});
    expect(parserInstance.parser.parseXmlBooleanStream).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parseXmlBooleanStream).toHaveBeenCalledWith('content');
  });

  test('should be a streaming parser', () => {
    expect(new SparqlXmlResultParser().isStreaming()).toBeTruthy();
  });
});
