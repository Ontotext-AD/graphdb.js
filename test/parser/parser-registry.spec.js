const ParserRegistry = require('parser/parser-registry');
const UnsupportedParser = require('./parser-mocks').UnsupportedParser;
const ParserWhichDoesNotImplementTheAPI = require('./parser-mocks').ParserWhichDoesNotImplementTheAPI;
const ParserWhichDoesNotProvideSupportedType = require('./parser-mocks').ParserWhichDoesNotProvideSupportedType;
const RdfAsXmlParser = require('./parser-mocks').RdfAsXmlParser;
const RdfAsJsonParser = require('./parser-mocks').RdfAsJsonParser;
const AnotherRdfAsJsonParser = require('./parser-mocks').AnotherRdfAsJsonParser;

describe('ParserRegistry', () => {

  let registry;

  beforeEach(() => {
    registry = new ParserRegistry();
  });

  describe('initialize', () => {
    test('should be initialized with default empty map', () => {
      const registry = new ParserRegistry();
      expect(registry.parsers).toEqual({});
    });

    test('should validate provided parsers and throw error when invalid parser is provided', () => {
      expect(() => {
        new ParserRegistry([new RdfAsJsonParser(), new UnsupportedParser()]);
      }).toThrow(Error('Parser is not provided or does not implement ContentParser!'));
    });

    test('should populate provided parsers', () => {
      const registry = new ParserRegistry([new RdfAsJsonParser(), new RdfAsXmlParser()]);

      const expected = {
        'application/rdf+json': new RdfAsJsonParser(),
        'application/rdf+xml': new RdfAsXmlParser(),
      };
      expect(registry.parsers).toEqual(expected);
    });
  });

  describe('register', () => {
    test('should throw error when a parser is not provided', () => {
      expect(() => registry.register()).toThrow(Error);
    });

    test('should throw error when parser does not implement the API', () => {
      expect(() => registry.register(new ParserWhichDoesNotImplementTheAPI()))
        .toThrow(Error('Method #getSupportedType() must be implemented!'));
    });

    test('should throw error when parser does not provide what type it supports', () => {
      expect(() => registry.register(new ParserWhichDoesNotProvideSupportedType()))
        .toThrow(Error('Parser type is mandatory parameter!'));
    });

    test('should register new parser', () => {
      registry.register(new RdfAsJsonParser());

      expect(Object.keys(registry.parsers)[0]).toEqual('application/rdf+json');
      expect(Object.values(registry.parsers)[0]).toBeInstanceOf(RdfAsJsonParser);
    });

    test('should override an existing parser', () => {
      registry.register(new RdfAsJsonParser());
      registry.register(new AnotherRdfAsJsonParser());

      expect(Object.keys(registry.parsers)[0]).toEqual('application/rdf+json');
      expect(Object.values(registry.parsers)[0]).toBeInstanceOf(AnotherRdfAsJsonParser);
    });
  });

  describe('get', () => {
    test('should return a registered parser of given type', () => {
      registry.register(new RdfAsJsonParser());

      expect(registry.get('application/rdf+json')).toBeInstanceOf(RdfAsJsonParser);
    });

    test('should return undefined if parser of given type is not found', () => {
      registry.register(new RdfAsJsonParser());

      expect(registry.get('application/rdf+xml')).toBeUndefined();
    });
  });
});
