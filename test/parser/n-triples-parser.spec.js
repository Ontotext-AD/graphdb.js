const NTriplesParser = require('parser/n-triples-parser');
const RdfContentType = require('http/rdf-content-type');

describe('NTriplesParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new NTriplesParser().parser).toBeDefined();
  });

  test('should set isDefault if provided to constructor', () => {
    let parserInstance = new NTriplesParser();
    expect(parserInstance.isDefault()).toBeFalsy();
    parserInstance = new NTriplesParser(true);
    expect(parserInstance.isDefault()).toBeTruthy();
  });

  test('should return supported type', () => {
    expect(new NTriplesParser().getSupportedType()).toEqual(RdfContentType.N_TRIPLES);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new NTriplesParser();
    parserInstance.parser.parse = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parse).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parse).toHaveBeenCalledWith('content');
  });
});
