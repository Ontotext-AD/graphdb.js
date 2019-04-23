const GetStatementsPayload = require('repository/get-statements-payload');
const RDFContentType = require('http/rdf-content-type');

describe('GetStatementsPayload', () => {
  test('should set responseType=application/rdf+json by default', () => {
    expect(new GetStatementsPayload().get().responseType).toEqual('application/rdf+json');
  });

  test('should populate properties in the underlying payload', () => {
    let payload = new GetStatementsPayload()
      .setResponseType(RDFContentType.RDF_XML)
      .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
      .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
      .setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
      .setContext('<http://example.org/graph3>')
      .setInference(true)
      .get();
    expect(payload).toEqual({
      subject: '<http://eunis.eea.europa.eu/countries/AZ>',
      predicate: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>',
      object: '"7931000"^^http://www.w3.org/2001/XMLSchema#integer',
      context: '<http://example.org/graph3>',
      inference: true,
      responseType: 'application/rdf+xml'
    });
  });
});
