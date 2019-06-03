const TriGParser = require('parser/trig-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('TriGParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new TriGParser().parser).toBeDefined();
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new TriGParser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new TriGParser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should return supported type', () => {
    expect(new TriGParser().getSupportedType()).toEqual(RDFMimeType.TRIG);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new TriGParser();
    parserInstance.parser.parse = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parse).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parse).toHaveBeenCalledWith('content');
  });
});
