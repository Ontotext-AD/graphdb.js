const path = require('path');
const {RDFRepositoryClient, GetStatementsPayload} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const Config = require('config.js');
const Utils = require('utils.js');

describe('Upload data', () => {

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  test('Should upload and overwrite data', () => {
    let params = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://learningsparql.com/ns/data/i0432>')
      .setPredicate('<http://learningsparql.com/ns/addressbook/firstName>')
      .setContext('<http://domain/graph/data-graph-3>');

    let expectedResponse = Utils.loadFile('./data/upload_overwrite/expected_response.json');
    let expectedResponseOverwritten = Utils.loadFile('./data/upload_overwrite/expected_response_overwritten.json');

    let sampleRdf = path.resolve(__dirname, './../data/sample-turtle.ttl');
    let turtleStream = Utils.getReadStream(sampleRdf);

    let sampleRdfEdited = path.resolve(__dirname, './../data/sample-turtle_edited.ttl');
    let turtleStreamEdited = Utils.getReadStream(sampleRdfEdited);

    let context = '<http://domain/graph/data-graph-3>';
    return rdfClient.upload(turtleStream, RDFMimeType.TURTLE, context, null).then(() => {
      return rdfClient.get(params);
    }).then((resp) => {
      expect(resp).toEqual(JSON.parse(expectedResponse));
      return rdfClient.overwrite(turtleStreamEdited, RDFMimeType.TURTLE, context, null);
    }).then(() => {
      return rdfClient.get(params);
    }).then((resp) => {
      expect(resp).toEqual(JSON.parse(expectedResponseOverwritten));
    });
  });
});
