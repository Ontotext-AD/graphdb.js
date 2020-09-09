const SparqlJsonResultParser = require('parser/sparql-json-result-parser');
const RDFMimeType = require('http/rdf-mime-type');
const QueryType = require('query/query-type');

describe('SparqlJsonResultParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new SparqlJsonResultParser().parser).toBeDefined();
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new SparqlJsonResultParser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new SparqlJsonResultParser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should return supported type', () => {
    expect(new SparqlJsonResultParser().getSupportedType()).toEqual(RDFMimeType.SPARQL_RESULTS_JSON);
  });

  test('should invoke underlying parser for text stream result parsing', () => {
    const parserInstance = new SparqlJsonResultParser();
    parserInstance.parser.parseJsonResultsStream = jest.fn();
    parserInstance.parse('content', {queryType: QueryType.SELECT});
    expect(parserInstance.parser.parseJsonResultsStream).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parseJsonResultsStream).toHaveBeenCalledWith('content');
  });

  test('should invoke underlying parser for boolean stream result parsing', () => {
    const parserInstance = new SparqlJsonResultParser();
    parserInstance.parser.parseJsonBooleanStream = jest.fn();
    parserInstance.parse('content', {queryType: QueryType.ASK});
    expect(parserInstance.parser.parseJsonBooleanStream).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parseJsonBooleanStream).toHaveBeenCalledWith('content');
  });

  test('should be a streaming parser', () => {
    expect(new SparqlJsonResultParser().isStreaming()).toBeTruthy();
  });
});
