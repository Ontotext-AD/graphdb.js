const NQuadsParser = require('parser/n-quads-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('NQuadsParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new NQuadsParser().parser).toBeDefined();
  });

  test('should set isDefault if provided to constructor', () => {
    let parserInstance = new NQuadsParser();
    expect(parserInstance.isDefault()).toBeFalsy();
    parserInstance = new NQuadsParser(true);
    expect(parserInstance.isDefault()).toBeTruthy();
  });

  test('should return supported type', () => {
    expect(new NQuadsParser().getSupportedType()).toEqual(RDFMimeType.N_QUADS);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new NQuadsParser();
    parserInstance.parser.parse = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parse).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parse).toHaveBeenCalledWith('content');
  });
});
