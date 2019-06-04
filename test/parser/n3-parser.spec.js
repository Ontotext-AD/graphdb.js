const N3Parser = require('parser/n3-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('N3Parser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new N3Parser().parser).toBeDefined();
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new N3Parser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new N3Parser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should return supported type', () => {
    expect(new N3Parser().getSupportedType()).toEqual(RDFMimeType.N3);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new N3Parser();
    parserInstance.parser.parse = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parse).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parse).toHaveBeenCalledWith('content');
  });

  test('should not be a streaming parser', () => {
    expect(new N3Parser().isStreaming()).toBeFalsy();
  });
});
