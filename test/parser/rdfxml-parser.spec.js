const RDFXmlParser = require('parser/rdfxml-parser');
const RDFMimeType = require('http/rdf-mime-type');

describe('RDFXmlParser', () => {
  test('should create instance of underlying parser and store it as a member', () => {
    expect(new RDFXmlParser().parser).toBeDefined();
  });

  test('should store provided with the constructor configuration', () => {
    let parserInstance = new RDFXmlParser();
    expect(parserInstance.getConfig()).toEqual({});

    parserInstance = new RDFXmlParser({param: true});
    expect(parserInstance.getConfig()).toEqual({param: true});
  });

  test('should return supported type', () => {
    expect(new RDFXmlParser().getSupportedType()).toEqual(RDFMimeType.RDF_XML);
  });

  test('should invoke underlying parser for text stream result parsing', () => {
    const parserInstance = new RDFXmlParser();
    parserInstance.parser.import = jest.fn();
    parserInstance.parse('content');
    expect(parserInstance.parser.import).toHaveBeenCalledTimes(1);
    expect(parserInstance.parser.import).toHaveBeenCalledWith('content');
  });

  test('should be a streaming parser', () => {
    const parserInstance = new RDFXmlParser();
    expect(parserInstance.isStreaming()).toBeTruthy();
  });
});
