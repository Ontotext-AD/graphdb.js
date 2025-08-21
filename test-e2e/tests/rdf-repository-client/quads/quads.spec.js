const {RDFMimeType} = require('graphdb').http;
const {RDFRepositoryClient, GetStatementsPayload} = require('graphdb').repository;
const {N3Parser, TriGParser} = require('graphdb').parser;
const N3 = require('n3');
const {DataFactory, Writer} = N3;
const {namedNode, literal, quad, defaultGraph} = DataFactory;
const Utils = require('utils.js');
const Config = require('config.js');

describe('Manage quads', () => {
  let rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  let quads = [
    getQuad('resource-1', 'relation-1', 'uri-1'),
    getQuad('resource-1', 'relation-2', 'uri-2'),
    getQuadLiteral('resource-1', 'boolean-property', 'true', namedNode('xsd:boolean')),
    getQuadLiteral('resource-1', 'title', 'Title', 'en'),
    getQuadLiteral('resource-1', 'title', 'Titel', 'de'),

    getQuad('resource-2', 'relation-1', 'uri-2', 'data-graph-1'),
    getQuad('resource-2', 'relation-2', 'uri-3', 'data-graph-1'),
    getQuadLiteral('resource-2', 'title', 'Title', 'en', 'data-graph-2'),
    getQuadLiteral('resource-2', 'title', 'Titel', 'de', 'data-graph-2'),

    getQuad('resource-3', 'relation-1', 'uri-4', 'data-graph-1'),
  ];

  test('Should add, put and remove quads', () => {

    let putQuads = [
      getQuad('resource-1', 'relation-1', 'uri-2'),
      getQuad('resource-1', 'relation-2', 'uri-3')
    ];

    let getResource1 = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-1>');

    let getResource2 = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-2>');

    let getResource3 = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-3>');

    let expectedResponseResource1 = Utils.loadFile('./data/quads/expected_response_resource1.json');
    let expectedResponseResource1Changed = Utils.loadFile('./data/quads/expected_response_resource1_changed.json');
    let expectedResponseResource2 = Utils.loadFile('./data/quads/expected_response_resource2.json');
    let expectedResponseResource3 = Utils.loadFile('./data/quads/expected_response_resource3.json');

    return rdfClient.addQuads(quads).then(() => {
      return rdfClient.get(getResource1);
    }).then(() => {
      return rdfClient.get(getResource1);
    }).then((resp) => {
      expect(resp).toEqual(JSON.parse(expectedResponseResource1));
      return rdfClient.get(getResource2);
    }).then((resp) => {
      expect(resp).toEqual(JSON.parse(expectedResponseResource2));
      return rdfClient.get(getResource3);
    }).then((resp) => {
      expect(resp).toEqual(JSON.parse(expectedResponseResource3));
      return rdfClient.putQuads(putQuads);
    }).then(() => {
      return rdfClient.get(getResource1);
    }).then((resp) => {
      expect(resp).toEqual(JSON.parse(expectedResponseResource1Changed));
      return rdfClient.deleteStatements('<http://domain/resource/resource-1>');
    }).then(() => {
      return rdfClient.deleteStatements('<http://domain/resource/resource-2>');
    }).then(() => {
      return rdfClient.deleteStatements('<http://domain/resource/resource-3>');
    });
  });

  test('Should add quads and retrieve them in different format', () => {
    rdfClient.registerParser((new N3Parser()));
    let payload = buildPayload(RDFMimeType.TRIG);
    const expectedTriG = Utils.loadFile('./data/quads/expectedResponseTrig.txt').trim();

    return rdfClient.addQuads(quads).then(() => {
      return rdfClient.get(payload);
    }).then((resp) => {
      return Promise.all([
        toSortedNQuads(resp),
        toSortedNQuads(expectedTriG)
      ]);
    }).then(([actualCanon, expectedCanon]) => {
      expect(actualCanon).toEqual(expectedCanon);
      payload = buildPayload(RDFMimeType.N3);
      return rdfClient.get(payload);
    }).then((resp) => {
      const expectedN3 = [quad(
        namedNode('http://domain/resource/resource-3'),
        namedNode('http://domain/property/relation-1'),
        namedNode('http://domain/value/uri-4'),
        defaultGraph())];

      expect(resp).toEqual(expectedN3);
    });
  });
});

function buildPayload(type) {
  return new GetStatementsPayload()
    .setSubject('<http://domain/resource/resource-3>')
    .setResponseType(type);
}

function getQuad(s, p, o, g) {
  if (g) {
    return quad(namedNode(subj(s)), namedNode(pred(p)), namedNode(obj(o)), namedNode(context(g)));
  }
  return quad(namedNode(subj(s)), namedNode(pred(p)), namedNode(obj(o)));
}

function getQuadLiteral(s, p, o, t, g) {
  if (g) {
    return quad(namedNode(subj(s)), namedNode(pred(p)), literal(o, t), namedNode(context(g)));
  }
  return quad(namedNode(subj(s)), namedNode(pred(p)), literal(o, t));
}

function subj(id) {
  return `http://domain/resource/${id}`;
}

function pred(id) {
  return `http://domain/property/${id}`;
}

function obj(id) {
  return `http://domain/value/${id}`;
}

function context(id) {
  return `http://domain/graph/${id}`;
}

function toSortedNQuads(trigOrTurtleString) {
  let quadsParsed;
  try {
    const trigParser = new TriGParser();
    quadsParsed = trigParser.parse(trigOrTurtleString);
  } catch (e) {
    const turtleParser = new N3Parser();
    quadsParsed = turtleParser.parse(trigOrTurtleString);
  }

  return new Promise((resolve, reject) => {
    const writer = new Writer({ format: 'N-Quads' });
    writer.addQuads(quadsParsed);
    writer.end((err, nquads) => {
      if (err) {
        reject(err);
        return;
      }
      const sorted = nquads
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0)
        .sort()
        .join('\n');
      resolve(sorted);
    });
  });
}
