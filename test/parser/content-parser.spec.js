const RdfAsXmlParser = require('./parser-mocks').RdfAsXmlParser;
const ParserWithNoParseMethod = require('./parser-mocks').ParserWithNoParseMethod;
const ParserWithNoGetSupportedTypeMethod = require('./parser-mocks').ParserWithNoGetSupportedTypeMethod;

describe('ContentParser', () => {
  test('should throw error if parser does not implement ContentParser#getSupportedType', () => {
    const parser = new ParserWithNoGetSupportedTypeMethod();
    expect(() => {
      parser.getSupportedType();
    }).toThrow(Error('Method #getSupportedType() must be implemented!'));
  });

  test('should throw error if parser does not implement ContentParser#parse', () => {
    const parser = new ParserWithNoParseMethod();
    expect(() => {
      parser.parse('content');
    }).toThrow(Error('Method #parse(content) must be implemented!'));
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new RdfAsXmlParser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new RdfAsXmlParser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should instantiate a valid implementation properly', () => {
    const parser = new RdfAsXmlParser();
    expect(parser).toBeDefined();
  });

  test('should not be streaming parser by default', () => {
    expect(new RdfAsXmlParser().isStreaming()).toBeFalsy();
  });
});
