const N3Parser = require('parser/n3-parser');
const RdfContentType = require('http/rdf-content-type');

describe('N3Parser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new N3Parser().parser).toBeDefined();
  });

  test('should set isDefault if provided to constructor', () => {
    let parserInstance = new N3Parser();
    expect(parserInstance.isDefault()).toBeFalsy();
    parserInstance = new N3Parser(true);
    expect(parserInstance.isDefault()).toBeTruthy();
  });

  test('should return supported type', () => {
    expect(new N3Parser().getSupportedType()).toEqual(RdfContentType.N3);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new N3Parser();
    parserInstance.parser.parse = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parse).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parse).toHaveBeenCalledWith('content');
  });
});
