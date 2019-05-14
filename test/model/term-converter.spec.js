const TermConverter = require('model/term-converter');

const N3 = require('n3');
const {DataFactory} = N3;
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
});
