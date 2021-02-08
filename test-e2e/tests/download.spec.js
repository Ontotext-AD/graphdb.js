const {RDFRepositoryClient,
  GetStatementsPayload, AddStatementPayload} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const Utils = require('utils');
const Config = require('config');

describe('Should test download method', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should download data as stream', () => {
    const addPayload = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-1')
      .setPredicate('http://domain/property/relation-1')
      .setObject('Title')
      .setLanguage('en');

    const payload = new GetStatementsPayload()
      .setResponseType(RDFMimeType.TURTLE)
      .setSubject('<http://domain/resource/resource-1>')
      .setPredicate('<http://domain/property/relation-1>');

    return rdfClient.add(addPayload).then(() => {
      return rdfClient.download(payload);
    }).then((stream) => {
      return Utils.readStream(stream);
    }).then((stream) => {
      expect(stream.length).toBe(409);
      expect(stream).toContain('<http://domain/resource/resource-1>');
      expect(stream).toContain('<http://domain/property/relation-1>');
      expect(stream).toContain('"Title"@en');
    });
  });
});
