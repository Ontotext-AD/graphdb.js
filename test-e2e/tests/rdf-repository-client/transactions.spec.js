const path = require('path');
const Utils = require('utils.js');
const Config = require('config.js');
const {RDFRepositoryClient,
  GetStatementsPayload, AddStatementPayload} = require('graphdb').repository;
const {RDFMimeType, QueryContentType} = require('graphdb').http;
const N3 = require('n3');
const {DataFactory} = N3;
const {namedNode, literal, quad} = DataFactory;
const {GetQueryPayload,
  QueryType, QueryLanguage, UpdateQueryPayload} = require('graphdb').query;
const {XSD} = require('graphdb').model.Types;

describe('Transactional operations', () => {
  beforeAll(() => {
    return Utils.createRepo(Config.testRepoPath);
  });

  afterAll(() => {
    return Utils.deleteRepo('Test_repo');
  });

  const rdfClient = new RDFRepositoryClient(Config.restApiConfig);

  test('Should begin a transaction and check size', () => {
    const wineRdf = path.resolve(__dirname, './../data/wine.rdf');
    let transactionalClient;
    return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null)
      .then(() => {
        return rdfClient.beginTransaction();
      }).then((transaction) => {
        transactionalClient = transaction;
        return transactionalClient.getSize();
      }).then((resp) => {
        expect(resp).toBe(1839);
      }).then(() => {
        expect(transactionalClient.isActive()).toBe(true);
        return transactionalClient.commit();
      }).then(() => {
        expect(transactionalClient.isActive()).toBe(false);
      }).then(() => {
        return rdfClient.deleteAllStatements();
      }).then(() => {
        return rdfClient.deleteNamespaces();
      });
  });

  test('Should begin a transaction add file and commit it', () => {
    let transactionalClient;
    const rowsRdf = path.resolve(__dirname, './../data/rows.rdf');

    return rdfClient.beginTransaction().then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient
        .addFile(rowsRdf, RDFMimeType.RDF_XML, null, null);
    }).then(() => {
      return rdfClient.getSize();
    }).then((resp) => {
      expect(resp).toBe(0);
    }).then(() => {
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.getSize();
    }).then((resp) => {
      expect(resp).toBe(462);
    }).then(() => {
      return rdfClient.deleteAllStatements();
    }).then(() => {
      return rdfClient.deleteNamespaces();
    });
  });

  test('Should begin a transaction add file and rollback it', () => {
    let transactionalClient;
    const rowsRdf = path.resolve(__dirname, './../data/rows.rdf');

    return rdfClient.beginTransaction().then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient
        .addFile(rowsRdf, RDFMimeType.RDF_XML, null, null);
    }).then(() => {
      return transactionalClient.rollback();
    }).then(() => {
      return rdfClient.getSize();
    }).then((resp) => {
      expect(resp).toBe(0);
    });
  });

  test('Should upload data in transaction, commit it and delete it', () => {
    let transactionalClient;
    const params = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://learningsparql.com/ns/data/i0432>')
      .setPredicate('<http://learningsparql.com/ns/addressbook/firstName>')
      .setContext('<http://domain/graph/data-graph-3>');

    const sampleRdf = path.resolve(__dirname, './../data/sample-turtle.ttl');
    const turtleStream = Utils.getReadStream(sampleRdf);
    const context = '<http://domain/graph/data-graph-3>';

    return rdfClient.beginTransaction().then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient
        .upload(turtleStream, RDFMimeType.TURTLE, context, null);
    }).then(() => {
      return rdfClient.get(params);
    }).then((resp) => {
      expect(resp).toEqual({});
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.get(params);
    }).then((resp) => {
      expect(resp).toEqual({
        'http://learningsparql.com/ns/data/i0432': {
          'http://learningsparql.com/ns/addressbook/firstName': [
            {
              'value': 'Richard',
              'type': 'literal',
              'datatype': 'http://www.w3.org/2001/XMLSchema#string',
              'graphs': [
                'http://domain/graph/data-graph-3'
              ]
            }
          ]
        }
      });
      return rdfClient.beginTransaction();
    }).then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient.deleteData('<http://learningsparql.com/ns/data/i0432> <http://learningsparql.com/ns/addressbook/firstName> "Richard" .');
    }).then(() => {
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.get(params);
    }).then((resp) => {
      expect(resp).toEqual({});
      return rdfClient.deleteAllStatements();
    }).then(() => {
      return rdfClient.deleteNamespaces();
    });
  });

  test('Should add and delete data', () => {
    const addPayload = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-1')
      .setPredicate('http://domain/property/relation-1')
      .setObjectLiteral('Title', XSD.STRING, 'en');

    const getPayload = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-1>')
      .setPredicate('<http://domain/property/relation-1>');

    let transactionalClient;
    return rdfClient.beginTransaction().then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient.add(addPayload);
    }).then(() => {
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.get(getPayload);
    }).then((resp) => {
      expect(resp).toEqual({
        'http://domain/resource/resource-1': {
          'http://domain/property/relation-1': [
            {
              'value': 'Title',
              'type': 'literal',
              'lang': 'en'
            }
          ]
        }
      });
    }).then(() => {
      return rdfClient.beginTransaction();
    }).then((transaction) => {
      transactionalClient = transaction;
      // Deletion works only with turtle/trig currently
      const data = '<http://domain/resource/resource-1> <http://domain/property/relation-1> "Title"@en.';
      return transactionalClient.deleteData(data);
    }).then(() => {
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.get(getPayload);
    }).then((resp) => {
      expect(resp).toEqual({});
    });
  });

  test('Should get data in a transaction', () => {
    const addPayload = new AddStatementPayload()
      .setSubject('http://domain/resource/resource-1')
      .setPredicate('http://domain/property/relation-1')
      .setObjectLiteral('Title', XSD.STRING, 'en');

    const params = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-1>')
      .setPredicate('<http://domain/property/relation-1>');

    let transactionalClient;
    return rdfClient.beginTransaction().then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient.add(addPayload);
    }).then(() => {
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.beginTransaction();
    }).then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient.get(params);
    }).then((resp) => {
      expect(resp).toEqual({
        'http://domain/resource/resource-1': {
          'http://domain/property/relation-1': [
            {
              'value': 'Title',
              'type': 'literal',
              'lang': 'en'
            }
          ]
        }
      });
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.deleteAllStatements();
    });
  });

  test('Should add quads', () => {
    let transactionalClient;
    const quads = [
      getQuad('resource-1', 'relation-1', 'uri-1'),
      getQuad('resource-1', 'relation-2', 'uri-2'),
      getQuadLiteral('resource-1', 'boolean-property', 'true',
        namedNode('xsd:boolean')),
      getQuadLiteral('resource-1', 'title', 'Title', 'en'),
      getQuadLiteral('resource-1', 'title', 'Titel', 'de')
    ];

    const getResource1 = new GetStatementsPayload()
      .setResponseType(RDFMimeType.RDF_JSON)
      .setSubject('<http://domain/resource/resource-1>');

    const expectedResponseResource1 = Utils
      .loadFile('./data/transactions/expected_response_resource1.json');

    return rdfClient.beginTransaction().then((transaction) => {
      transactionalClient = transaction;
      return transactionalClient.addQuads(quads);
    }).then(() => {
      return transactionalClient.commit();
    }).then(() => {
      return rdfClient.get(getResource1);
    }).then((resp) => {
      expect(resp).toEqual(JSON.parse(expectedResponseResource1));
    });
  });

  describe('Should test queries in transactions', () => {
    beforeAll(() => {
      const wineRdf = path.resolve(__dirname, './../data/wine.rdf');
      return rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
    });

    test('Should test SELECT query in transaction', () => {
      const payloadWithInferenceTrue = new GetQueryPayload()
        .setQuery('select * where {<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#StonleighSauvignonBlanc> ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setContentType(QueryContentType.SPARQL_QUERY)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setInference(true);

      let transactionalClient;

      return rdfClient.beginTransaction().then((transaction) => {
        transactionalClient = transaction;
        return transactionalClient.query(payloadWithInferenceTrue);
      }).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        const expectedResponse = Utils.loadFile(
          './data/queries/expected_results_payload_inference_true.json');
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
        return transactionalClient.commit();
      }).then(() => {
        return rdfClient.deleteAllStatements();
      }).then(() => {
        return rdfClient.deleteNamespaces();
      });
    });

    test('Should test query rollback and commit in a transaction', () => {
      const query = Utils.loadFile('./data/queries/insert_query.sparql');
      const expected = Utils
        .loadFile('./data/queries/expected_results_named_graph.json');
      const expectedEmptyGraph = Utils
        .loadFile('./data/queries/expected_results_named_graph_empty.json');

      const insertData = new UpdateQueryPayload()
        .setQuery(query);

      const selectData = new GetQueryPayload()
        .setQuery('SELECT ?s ?p ?o FROM <http://wine.com/graph/wine2> WHERE {?s ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL);

      let transactionalClient;

      return rdfClient.beginTransaction().then((transaction) => {
        transactionalClient = transaction;
        return transactionalClient.update(insertData);
      }).then(() => {
        return transactionalClient.rollback();
      }).then(() => {
        return rdfClient.query(selectData);
      }).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        expect(JSON.parse(stream)).toEqual(JSON.parse(expectedEmptyGraph));
      }).then(() => {
        return rdfClient.beginTransaction();
      }).then((transaction) => {
        transactionalClient = transaction;
        return transactionalClient.update(insertData);
      }).then(() => {
        return transactionalClient.commit();
      }).then(() => {
        return rdfClient.query(selectData);
      }).then((resp) => {
        return Utils.readStream(resp);
      }).then((stream) => {
        expect(JSON.parse(stream)).toEqual(JSON.parse(expected));
        return rdfClient.deleteAllStatements();
      });
    });

    test('Should test downloading data in a transaction', () => {
      const query = Utils.loadFile('./data/queries/insert_query.sparql');
      const expected = Utils
        .loadFile('./data/queries/expected_response_transaction_download.json');

      const insertData = new UpdateQueryPayload()
        .setQuery(query);

      const payload = new GetStatementsPayload()
        .setResponseType(RDFMimeType.RDF_JSON)
        .setSubject('<http://example/book1>')
        .setPredicate('<http://purl.org/dc/elements/1.1/title>');

      let transactionalClient;

      return rdfClient.beginTransaction().then((transaction) => {
        transactionalClient = transaction;
        return transactionalClient.update(insertData);
      }).then(() => {
        return transactionalClient.download(payload);
      }).then((stream) => {
        return Utils.readStream(stream);
      }).then((data) => {
        expect(JSON.parse(data)).toEqual(JSON.parse(expected));
      }).then(() => {
        return transactionalClient.rollback();
      }).then(() => {
        return rdfClient.beginTransaction();
      }).then((transaction) => {
        transactionalClient = transaction;
        return transactionalClient.download(payload);
      }).then((stream) => {
        return Utils.readStream(stream);
      }).then((data) => {
        expect(JSON.parse(data)).toEqual({});
        return transactionalClient.commit();
      });
    });
  });

  describe('Should test queries in transactions in secured database', () => {
    beforeAll(async () => {
      const wineRdf = path.resolve(__dirname, './../data/wine.rdf');
      await rdfClient.addFile(wineRdf, RDFMimeType.RDF_XML, null, null);
      await Utils.toggleSecurity(true);
    });

    afterAll(async () => {
      await Utils.toggleSecurity(false);
    })

    test('Should test SELECT query in transaction in secured database', async () => {
      const wineRdf = path.resolve(__dirname, './../data/wine.rdf');
      const payloadWithInferenceTrue = new GetQueryPayload()
        .setQuery('select * where {<http://www.w3.org/TR/2003/PR-owl-guide-20031209/wine#StonleighSauvignonBlanc> ?p ?o}')
        .setQueryType(QueryType.SELECT)
        .setContentType(QueryContentType.SPARQL_QUERY)
        .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON)
        .setQueryLn(QueryLanguage.SPARQL)
        .setInference(true);

      const rdfClientWithBasicAuth = new RDFRepositoryClient(Config.restApiBasicAuthConfig);
      const transactionalClient = await rdfClientWithBasicAuth.beginTransaction();
      await transactionalClient.query(payloadWithInferenceTrue)
        .then((response) => {
          return Utils.readStream(response);
        })
        .then((stream) => {
          const expectedResponse = Utils.loadFile('./data/queries/expected_results_payload_inference_true.json');
          expect(JSON.parse(stream)).toEqual(JSON.parse(expectedResponse));
          return transactionalClient.commit();
        });
    });
  });
});

function getQuad(s, p, o, g) {
  if (g) {
    return quad(namedNode(subj(s)), namedNode(pred(p)),
      namedNode(obj(o)), namedNode(context(g)));
  }
  return quad(namedNode(subj(s)), namedNode(pred(p)), namedNode(obj(o)));
}

function getQuadLiteral(s, p, o, t, g) {
  if (g) {
    return quad(namedNode(subj(s)), namedNode(pred(p)),
      literal(o, t), namedNode(context(g)));
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
