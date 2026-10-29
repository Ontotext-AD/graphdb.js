const path = require('path');
const {RDFRepositoryClient, GetStatementsPayload, AddStatementPayload} = require('graphdb').repository;
const {RDFMimeType} = require('graphdb').http;
const Config = require('config.js');
const Utils = require('utils.js');

describe('Upload data', () => {

  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  test('Should upload and overwrite data', () => {
    let params = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://learningsparql.com/ns/data/i0432>')
      .setPredicate('<http://learningsparql.com/ns/addressbook/firstName>')
      .setContext('<http://domain/graph/data-graph-3>');

    let expectedResponse = Utils.loadFile('./data/upload_overwrite/expected_response.json');
    let expectedResponseOverwritten = Utils.loadFile('./data/upload_overwrite/expected_response_overwritten.json');

    let sampleRdf = path.resolve(__dirname, './../../data/sample-turtle.ttl');
    let turtleStream = Utils.getReadStream(sampleRdf);

    let sampleRdfEdited = path.resolve(__dirname, './../../data/sample-turtle_edited.ttl');
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

  describe('adding or replacing the existing statements', () => {
    const existingContext = 'http://domain/graph/existing';
    const otherContext = 'http://domain/graph/other';
    const incomingStatementFile = path.resolve(__dirname, './../../data/upload_overwrite/statement-b.ttl');

    const writes = {
      upload: (context) => rdfClient.upload(Utils.getReadStream(incomingStatementFile), RDFMimeType.TURTLE, context, null),
      addFile: (context) => rdfClient.addFile(incomingStatementFile, RDFMimeType.TURTLE, context, null),
      overwrite: (context) => rdfClient.overwrite(Utils.getReadStream(incomingStatementFile), RDFMimeType.TURTLE, context, null),
      putFile: (context) => rdfClient.putFile(incomingStatementFile, RDFMimeType.TURTLE, context, null)
    };

    function addExistingStatement(context) {
      return rdfClient.add(new AddStatementPayload()
        .setSubject('http://domain/resource/a')
        .setPredicate('http://domain/property/p')
        .setObject('A')
        .setLanguage('en')
        .setContext(context));
    }

    function writeIncomingStatement(method, context) {
      return writes[method](context && `<${context}>`);
    }

    function sizeOf(context) {
      return rdfClient.getSize(context && `<${context}>`);
    }

    beforeEach(() => {
      return rdfClient.deleteAllStatements();
    });

    describe.each(['upload', 'addFile'])('%s', (method) => {
      test('should keep the existing statements when no context is given', async () => {
        await addExistingStatement();
        await writeIncomingStatement(method);
        expect(await sizeOf()).toEqual(2);
      });

      test('should keep the existing statements in the same context', async () => {
        await addExistingStatement(existingContext);
        await writeIncomingStatement(method, existingContext);
        expect(await sizeOf(existingContext)).toEqual(2);
      });

      test('should keep the existing statements in another context', async () => {
        await addExistingStatement(existingContext);
        await writeIncomingStatement(method, otherContext);
        expect(await sizeOf(existingContext)).toEqual(1);
        expect(await sizeOf(otherContext)).toEqual(1);
      });

      test('should keep the existing statements in named graphs when no context is given', async () => {
        await addExistingStatement(existingContext);
        await writeIncomingStatement(method);
        expect(await sizeOf(existingContext)).toEqual(1);
        expect(await sizeOf()).toEqual(2);
      });
    });

    describe.each(['overwrite', 'putFile'])('%s', (method) => {
      test('should replace all statements when no context is given', async () => {
        await addExistingStatement();
        await addExistingStatement(existingContext);
        await writeIncomingStatement(method);
        expect(await sizeOf(existingContext)).toEqual(0);
        expect(await sizeOf()).toEqual(1);
      });

      test('should replace the statements in the same context', async () => {
        await addExistingStatement(existingContext);
        await writeIncomingStatement(method, existingContext);
        expect(await sizeOf(existingContext)).toEqual(1);
        expect(await sizeOf()).toEqual(1);
      });

      test('should keep the statements in another context', async () => {
        await addExistingStatement(existingContext);
        await writeIncomingStatement(method, otherContext);
        expect(await sizeOf(existingContext)).toEqual(1);
        expect(await sizeOf(otherContext)).toEqual(1);
      });
    });
  });
});
