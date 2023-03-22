const {RDFRepositoryClient,
  GetStatementsPayload, AddStatementPayload} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Download', () => {
  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should download data as stream in turtle format', () => {
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
      expect(stream.length).toBe(1426);
      expect(stream).toContain('<http://domain/resource/resource-1>');
      expect(stream).toContain('<http://domain/property/relation-1>');
      expect(stream).toContain('"Title"@en');
    });
  });
});
