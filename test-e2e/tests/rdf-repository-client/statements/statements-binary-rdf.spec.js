const {Readable} = require('stream');
const {RDFRepositoryClient, RepositoryClientConfig, AddStatementPayload,
  GetStatementsPayload} = require('graphdb').repository;
const {GetQueryPayload, QueryType} = require('graphdb').query;
const {RDFMimeType} = require('graphdb').http;
const Utils = require('utils.js');
const Config = require('config.js');

const SUBJECT = 'http://domain/resource/resource-1';
const PREDICATE = 'http://domain/property/label';
const LABEL = 'Ünïcödé café – Кирилица 日本語';

describe('Statements as binary RDF', () => {
  const sourceClient = new RDFRepositoryClient(Config.restApiConfig);
  const targetClient = new RDFRepositoryClient(
    new RepositoryClientConfig(Config.serverAddress)
      .setEndpoints([`${Config.serverAddress}/repositories/Test_repo_2`]));

  beforeAll(() => {
    return Utils.createRepositories([Config.testRepoPath,
      Config.testRepo2Path]);
  });

  afterAll(() => {
    return Promise.all([Utils.deleteRepo('Test_repo'),
      Utils.deleteRepo('Test_repo_2')]);
  });

  test('Should get statements with non-ASCII literals as binary RDF and ' +
    'upload them to another repository', () => {
    const addPayload = new AddStatementPayload()
      .setSubject(SUBJECT)
      .setPredicate(PREDICATE)
      .setObjectLiteral(LABEL);
    const getPayload = new GetStatementsPayload()
      .setSubject(`<${SUBJECT}>`)
      .setResponseType(RDFMimeType.BINARY_RDF);

    return sourceClient.add(addPayload).then(() => {
      return sourceClient.get(getPayload);
    }).then((data) => {
      expect(Buffer.isBuffer(data)).toBe(true);
      return targetClient.upload(Readable.from([data]),
        RDFMimeType.BINARY_RDF);
    }).then(() => {
      const query = new GetQueryPayload()
        .setQuery(`ASK { <${SUBJECT}> <${PREDICATE}> "${LABEL}" }`)
        .setQueryType(QueryType.ASK)
        .setResponseType(RDFMimeType.BOOLEAN_RESULT);
      return targetClient.query(query);
    }).then((resp) => Utils.readStream(resp)).then((result) => {
      expect(result).toBe('true');
    });
  });
});
