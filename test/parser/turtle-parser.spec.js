const TurtleParser = require('parser/turtle-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('TurtleParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new TurtleParser().parser).toBeDefined();
  });

  test('should set isDefault if provided to constructor', () => {
    let parserInstance = new TurtleParser();
    expect(parserInstance.isDefault()).toBeFalsy();
    parserInstance = new TurtleParser(true);
    expect(parserInstance.isDefault()).toBeTruthy();
  });

  test('should return supported type', () => {
    expect(new TurtleParser().getSupportedType()).toEqual(RDFMimeType.TURTLE);
  });

  test('should invoke underlying parser', () => {
    const parserInstance = new TurtleParser();
    parserInstance.parser.parse = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.parse).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.parse).toHaveBeenCalledWith('content');
  });
});
