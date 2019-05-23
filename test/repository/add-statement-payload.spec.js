const AddStatementPayload = require('repository/add-statement-payload');
const XSD = require('model/types').XSD;

describe('AddStatementPayload', () => {

  test('should properly create a payload with the provided values', () => {
    const payload = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-1')
      .setPredicate('http://domain/property/relation-1')
      .setObject('http://domain/resource/resource-2')
      .setContext('http://domain/graph/graph-1')
      .setBaseURI('http://domain/base');
    expect(payload.getSubject()).toEqual('http://domain/resource/resource-1');
    expect(payload.getPredicate()).toEqual('http://domain/property/relation-1');
    expect(payload.getObject()).toEqual('http://domain/resource/resource-2');
    expect(payload.getContext()).toEqual('http://domain/graph/graph-1');
    expect(payload.getLanguage()).toBeUndefined();
    expect(payload.getDataType()).toBeUndefined();
    expect(payload.getBaseURI()).toEqual('http://domain/base');
  });

  test('should properly create a payload with literal having a language', () => {
    const payload = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-1')
      .setPredicate('http://domain/property/property-1')
      .setObject('Some multi language property')
      .setLanguage('en')
      .setContext(['http://domain/graph/graph-1']);
    expect(payload.getSubject()).toEqual('http://domain/resource/resource-1');
    expect(payload.getPredicate()).toEqual('http://domain/property/property-1');
    expect(payload.getObject()).toEqual('Some multi language property');
    expect(payload.getContext()).toEqual(['http://domain/graph/graph-1']);
    expect(payload.getLanguage()).toEqual('en');
    expect(payload.getDataType()).toBeUndefined();
    expect(payload.getBaseURI()).toBeUndefined();
  });

  test('should properly create a payload with literal having a data type', () => {
    const payload = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-1')
      .setPredicate('http://domain/property/property-1')
      .setObject('4')
      .setDataType(XSD.INTEGER);
    expect(payload.getSubject()).toEqual('http://domain/resource/resource-1');
    expect(payload.getPredicate()).toEqual('http://domain/property/property-1');
    expect(payload.getObject()).toEqual('4');
    expect(payload.getContext()).toBeUndefined();
    expect(payload.getLanguage()).toBeUndefined();
    expect(payload.getDataType()).toEqual(XSD.INTEGER);
    expect(payload.getBaseURI()).toBeUndefined();
  });

  describe('setObjectLiteral()', () => {
    test('should autodetect string literal', () => {
      const payload = new AddStatementPayload().setObjectLiteral('String literal');
      expect(payload.getObject()).toEqual('String literal');
      expect(payload.getDataType()).toEqual(XSD.STRING);
    });

    test('should autodetect integer literal', () => {
      const payload = new AddStatementPayload().setObjectLiteral(4);
      expect(payload.getObject()).toEqual(4);
      expect(payload.getDataType()).toEqual(XSD.INTEGER);
    });

    test('should autodetect float literal', () => {
      const payload = new AddStatementPayload().setObjectLiteral(3.1415);
      expect(payload.getObject()).toEqual(3.1415);
      expect(payload.getDataType()).toEqual(XSD.DECIMAL);
    });

    test('should autodetect boolean literal', () => {
      const payload = new AddStatementPayload().setObjectLiteral(true);
      expect(payload.getObject()).toEqual(true);
      expect(payload.getDataType()).toEqual(XSD.BOOLEAN);
    });

    test('should allow to explicitly set the literal data type', () => {
      const payload = new AddStatementPayload().setObjectLiteral('true', XSD.BOOLEAN);
      expect(payload.getObject()).toEqual('true');
      expect(payload.getDataType()).toEqual(XSD.BOOLEAN);
    });

    test('should allow to set the literal language if the data type is xsd:string', () => {
      const payload = new AddStatementPayload().setObjectLiteral('String literal', XSD.STRING, 'en');
      expect(payload.getObject()).toEqual('String literal');
      expect(payload.getDataType()).toEqual(XSD.STRING);
      expect(payload.getLanguage()).toEqual('en');
    });

    test('should skip setting the literal language if the data type is NOT xsd:string', () => {
      const payload = new AddStatementPayload().setObjectLiteral('true', XSD.BOOLEAN, 'en');
      expect(payload.getObject()).toEqual('true');
      expect(payload.getDataType()).toEqual(XSD.BOOLEAN);
      expect(payload.getLanguage()).toBeUndefined();
    });
  });

});
