const JsonLDParser = require('parser/jsonld-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('JsonLDParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new JsonLDParser().parser).toBeDefined();
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new JsonLDParser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new JsonLDParser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should return supported type', () => {
    expect(new JsonLDParser().getSupportedType()).toEqual(RDFMimeType.JSON_LD);
  });

  test('should invoke underlying parser for text stream result parsing', () => {
    const parserInstance = new JsonLDParser();
    parserInstance.parser.import = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.import).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.import).toHaveBeenCalledWith('content');
  });

  test('should be a streaming parser', () => {
    const parserInstance = new JsonLDParser();
    expect(parserInstance.isStreaming()).toBeTruthy();
  });
});
