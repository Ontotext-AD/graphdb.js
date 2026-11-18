const RDFJsonParser = require('parser/rdf-json-parser');
const RDFMimeType = require('http/rdf-mime-type');
const TermConverter = require('model/term-converter');

const TRIPLE_TERM = '<<( <http://ex.org/alice> <http://ex.org/knows> <http://ex.org/bob> )>>';
const ENCODED_TRIPLE_TERM = TermConverter.toBase64TripleTerm(TRIPLE_TERM);

const DOCUMENT = {
  'http://ex.org/s': {
    'http://ex.org/p': [
      {type: 'uri', value: 'http://ex.org/o'},
      {type: 'bnode', value: '_:b1'},
      {type: 'literal', value: 'hello', lang: 'en'},
      {type: 'literal', value: '42', datatype: 'http://www.w3.org/2001/XMLSchema#integer'},
      {type: 'literal', value: 'plain'}
    ]
  },
  '_:b1': {
    'http://ex.org/q': [{type: 'uri', value: 'http://ex.org/o2'}]
  },
  'http://ex.org/statement1': {
    'http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies': [{type: 'uri', value: ENCODED_TRIPLE_TERM}]
  }
};

describe('RDFJsonParser', () => {
  test('should return supported type', () => {
    expect(new RDFJsonParser().getSupportedType()).toEqual(RDFMimeType.RDF_JSON);
  });

  test('should not be a streaming parser', () => {
    expect(new RDFJsonParser().isStreaming()).toBe(false);
  });

  test('should parse named node subjects, predicates and objects', () => {
    const quads = new RDFJsonParser().parse(JSON.stringify(DOCUMENT));

    expect(quads[0].subject.termType).toEqual('NamedNode');
    expect(quads[0].subject.value).toEqual('http://ex.org/s');
    expect(quads[0].predicate.value).toEqual('http://ex.org/p');
    expect(quads[0].object.termType).toEqual('NamedNode');
    expect(quads[0].object.value).toEqual('http://ex.org/o');
  });

  test('should parse blank nodes without the _: prefix', () => {
    const quads = new RDFJsonParser().parse(DOCUMENT);

    expect(quads[1].object.termType).toEqual('BlankNode');
    expect(quads[1].object.value).toEqual('b1');
    const blankSubjectQuad = quads.find((q) => q.subject.termType === 'BlankNode');
    expect(blankSubjectQuad.subject.value).toEqual('b1');
    expect(blankSubjectQuad.object.value).toEqual('http://ex.org/o2');
  });

  test('should parse literals with a language, a data type or as xsd:string', () => {
    const [, , lang, typed, plain] = new RDFJsonParser().parse(DOCUMENT);

    expect(lang.object.termType).toEqual('Literal');
    expect(lang.object.value).toEqual('hello');
    expect(lang.object.language).toEqual('en');

    expect(typed.object.value).toEqual('42');
    expect(typed.object.datatype.value).toEqual('http://www.w3.org/2001/XMLSchema#integer');

    expect(plain.object.value).toEqual('plain');
    expect(plain.object.datatype.value).toEqual('http://www.w3.org/2001/XMLSchema#string');
  });

  test('should convert a triple term encoded as an IRI to a quad object', () => {
    const quads = new RDFJsonParser().parse(DOCUMENT);
    const tripleQuad = quads.find((q) => q.subject.value === 'http://ex.org/statement1');

    expect(tripleQuad.predicate.value).toEqual('http://www.w3.org/1999/02/22-rdf-syntax-ns#reifies');
    expect(tripleQuad.object.termType).toEqual('Quad');
    expect(tripleQuad.object.subject.value).toEqual('http://ex.org/alice');
    expect(tripleQuad.object.predicate.value).toEqual('http://ex.org/knows');
    expect(tripleQuad.object.object.value).toEqual('http://ex.org/bob');
  });

  test('should keep an IRI that cannot be decoded as a triple term', () => {
    const document = {
      'http://ex.org/s': {
        'http://ex.org/p': [{type: 'uri', value: 'urn:rdf4j:tripleTerm:bm90IGEgdHJpcGxl'}]
      }
    };
    const [quad] = new RDFJsonParser().parse(document);

    expect(quad.object.termType).toEqual('NamedNode');
    expect(quad.object.value).toEqual('urn:rdf4j:tripleTerm:bm90IGEgdHJpcGxl');
  });

  test('should add the quads to the default graph', () => {
    const quads = new RDFJsonParser().parse(DOCUMENT);

    quads.forEach((q) => expect(q.graph.termType).toEqual('DefaultGraph'));
  });

  test('should parse the content provided as a string, a buffer or an already parsed object', () => {
    const parser = new RDFJsonParser();
    const fromObject = parser.parse(DOCUMENT);

    expect(parser.parse(JSON.stringify(DOCUMENT)).map((q) => q.toString()))
      .toEqual(fromObject.map((q) => q.toString()));
    expect(parser.parse(Buffer.from(JSON.stringify(DOCUMENT))).map((q) => q.toString()))
      .toEqual(fromObject.map((q) => q.toString()));
  });

  test('should return no quads for an empty document', () => {
    expect(new RDFJsonParser().parse('{}')).toEqual([]);
  });
});
