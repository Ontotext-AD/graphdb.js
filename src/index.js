/* eslint-disable max-len */
module.exports = {
  http: {
    HttpClient: require('./http/http-client'),
    HttpRequestConfigBuilder: require('./http/http-request-config-builder'),
    QueryContentType: require('./http/query-content-type'),
    RDFMimeType: require('./http/rdf-mime-type')
  },

  repository: {
    RepositoryClientConfig: require('./repository/repository-client-config'),
    BaseRepositoryClient: require('./repository/base-repository-client'),
    RDFRepositoryClient: require('./repository/rdf-repository-client'),
    StatementPayload: require('./repository/statement-payload'),
    AddStatementPayload: require('./repository/add-statement-payload'),
    GetStatementsPayload: require('./repository/get-statements-payload')
  },

  server: {
    ServerClient: require('./server/server-client'),
    ServerClientConfig: require('./server/server-client-config')
  },

  transaction: {
    TransactionalRepositoryClient: require('./transaction/transactional-repository-client'),
    TransactionIsolationLevel: require('./transaction/transaction-isolation-level')
  },

  query: {
    QueryPayload: require('./query/query-payload'),
    GetQueryPayload: require('./query/get-query-payload'),
    UpdateQueryPayload: require('./query/update-query-payload'),
    QueryLanguage: require('./query/query-language'),
    QueryType: require('./query/query-type')
  },

  parser: {
    ParserRegistry: require('./parser/parser-registry'),
    ContentParser: require('./parser/content-parser'),
    N3Parser: require('./parser/n3-parser'),
    NQuadsParser: require('./parser/n-quads-parser'),
    NTriplesParser: require('./parser/n-triples-parser'),
    TriGParser: require('./parser/trig-parser'),
    TurtleParser: require('./parser/turtle-parser'),
    SparqlJsonResultParser: require('./parser/sparql-json-result-parser'),
    SparqlXmlResultParser: require('./parser/sparql-xml-result-parser')
  },

  logger: {
    Logger: require('./logging/logger'),
    ConsoleLogger: require('./logging/console-logger')
  },

  model: {
    Namespace: require('./model/namespace'),
    TermConverter: require('./model/term-converter'),
    Types: require('./model/types')
  }
};
