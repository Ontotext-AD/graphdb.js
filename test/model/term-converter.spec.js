const TermConverter = require('model/term-converter');
const DataFactory = require('service/data-factory');


const {NamedNode, Variable} = DataFactory.internal;

describe('TermConverter', () => {
  describe('getQuads()', () => {
    test('should support variables', () => {
      let quads = TermConverter.getQuads('subject', '?p', '?o');
      expect(quads.length).toEqual(1);

      let quad = quads[0];
      let subjectTerm = quad.subject;
      expect(subjectTerm).toBeInstanceOf(NamedNode);
      expect(subjectTerm.value).toEqual('subject');

      let predicateTerm = quad.predicate;
      expect(predicateTerm).toBeInstanceOf(Variable);
      expect(predicateTerm.value).toEqual('p');

      let objectTerm = quad.object;
      expect(objectTerm).toBeInstanceOf(Variable);
      expect(objectTerm.value).toEqual('o');
    });
  });

  describe('fromBase64RdfStarTriple()', () => {
    test('should decode correctly', () => {
      let expected = '<<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P206> <http://www.wikidata.org/entity/Q3657979>>>';
      let encoded = 'urn:rdf4j:triple:PDw8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1E0NzI-IDxodHRwOi8vd3d3Lndpa2lkYXRhLm9yZy9wcm9wL2RpcmVjdC9QMjA2PiA8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1EzNjU3OTc5Pj4-';
      let decoded = TermConverter.fromBase64RdfStarTriple(encoded);
      expect(decoded).toEqual(expected);
    });

    test('should not decode without base64 prefix', () => {
      let encoded = 'PDw8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1E0NzI-IDxodHRwOi8vd3d3Lndpa2lkYXRhLm9yZy9wcm9wL2RpcmVjdC9QMjA2PiA8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1EzNjU3OTc5Pj4-';
      let decoded = TermConverter.fromBase64RdfStarTriple(encoded);
      expect(decoded).toEqual(encoded);
    });
  });

  describe('toBase64RdfStarTriple()', () => {
    test('should encode correctly', () => {
      let expected = 'urn:rdf4j:triple:PDw8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1E0NzI-IDxodHRwOi8vd3d3Lndpa2lkYXRhLm9yZy9wcm9wL2RpcmVjdC9QMjA2PiA8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1EzNjU3OTc5Pj4-';
      let decoded = '<<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P206> <http://www.wikidata.org/entity/Q3657979>>>';
      let encoded = TermConverter.toBase64RdfStarTriple(decoded);
      expect(encoded).toEqual(expected);
    });

    test('should not encode without correct triple prefix', () => {
      let decoded = '<http://www.wikidata.org/entity/Q472>';
      let encoded = TermConverter.toBase64RdfStarTriple(decoded);
      expect(encoded).toEqual(decoded);
    });
  });
});
