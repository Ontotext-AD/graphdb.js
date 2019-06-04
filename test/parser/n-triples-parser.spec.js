const NTriplesParser = require('parser/n-triples-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('NTriplesParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new NTriplesParser().parser).toBeDefined();
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new NTriplesParser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new NTriplesParser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should return supported type', () => {
    expect(new NTriplesParser().getSupportedType()).toEqual(RDFMimeType.N_TRIPLES);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new NTriplesParser();
    parserInstance.parser.parse = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parse).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parse).toHaveBeenCalledWith('content');
  });

  test('should not be a streaming parser', () => {
    expect(new NTriplesParser().isStreaming()).toBeFalsy();
  });
});
