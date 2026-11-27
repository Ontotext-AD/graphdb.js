# CHANGELOG

## Unreleased
**Breaking changes:**
* ASK queries with `RDFMimeType.BOOLEAN_RESULT` as the response type resolve to `true` or `false` instead of a stream. Callers that read the stream must be updated.
* Upgraded `n3` to 2.x for RDF 1.2 support. `n3` 2.x formats Turtle/TriG output with different whitespace than 1.x, which may affect snapshots or string comparisons of serialized data, but does not affect semantic correctness or data round-tripping. Triple terms (RDF 1.2 feature) are now parsed as Quad instances in the object position of the quad; applications using triple terms should handle this new representation.
* Removed `RDFMimeType.SPARQL_STAR_RESULTS_JSON` and `RDFMimeType.SPARQL_STAR_RESULTS_TSV` from the supported response types of SELECT queries. GraphDB 12 returns HTTP 406 for them. Use `RDFMimeType.SPARQL_RESULTS_JSON` and `RDFMimeType.SPARQL_RESULTS_TSV`, which carry triple terms in RDF 1.2.
* Removed `RDFMimeType.TURTLE_STAR` and `RDFMimeType.TRIG_STAR` from the supported response types of DESCRIBE and CONSTRUCT queries. GraphDB 12 returns HTTP 406 for them. Use `RDFMimeType.TURTLE` and `RDFMimeType.TRIG`.
* RDF-star data is stored by GraphDB 12 as RDF 1.2 triple terms. `<< s p o >> :p :o` becomes a reifier: a new blank node with `rdf:reifies <<( s p o )>>`. A DELETE with the same RDF-star data returns 200 but removes nothing. Triple terms are only valid in the object position.

**Deprecated:**
* `RDFMimeType.TURTLE_STAR` and `RDFMimeType.TRIG_STAR` are deprecated. GraphDB 12 accepts them only as the `Content-Type` of uploaded data. Use `RDFMimeType.TURTLE` and `RDFMimeType.TRIG`.
* `RDFMimeType.SPARQL_STAR_RESULTS_JSON` and `RDFMimeType.SPARQL_STAR_RESULTS_TSV` are deprecated. Use `RDFMimeType.SPARQL_RESULTS_JSON` and `RDFMimeType.SPARQL_RESULTS_TSV`.
* `TermConverter.fromBase64RdfStarTriple` and `TermConverter.toBase64RdfStarTriple` are deprecated. Use `TermConverter.fromBase64TripleTerm` and `TermConverter.toBase64TripleTerm`.

**New features:**
* Added `BooleanResultParser`, exported from `parser`, which resolves `text/boolean` results to `true` or `false`. It is registered by default in the repository clients.
* GraphDB 12 support with RDF 1.2. GraphDB 12 returns RDF 1.2 by default (`graphdb.default.rdf.writer.version`, GDB-14480), which includes support for triple terms (`<<( s p o )>>` syntax in Turtle, TriG, and N-Triples formats). The library now correctly parses these responses.
* JSON-LD parser now converts Base64-encoded triple term IRIs (`urn:rdf4j:tripleTerm:*` from GraphDB 12, and `urn:rdf4j:triple:*` from GraphDB 11) to RDF/JS Quad objects with the triple as the object.
* Added `RDFJsonParser`, exported from `parser`, which parses `application/rdf+json` responses to RDF/JS Quad objects. It converts `urn:rdf4j:tripleTerm:*` IRIs from GraphDB 12 to Quad objects with the triple as the object. It is not registered by default; register it with `repository.registerParser(new RDFJsonParser())`. RDF/JSON has no named graphs, so the quads are in the default graph.
* Added `TermConverter.parseTripleTerm`, which parses a triple term in the `<<( s p o )>>` syntax to a Quad. The JSON-LD parser uses it too.
* Added `RDFMimeType.SPARQL_RESULTS_TSV` (`text/tab-separated-values`) as a supported response type for SELECT queries. It carries triple terms in RDF 1.2.
* Added E2E tests for RDF 1.2 triple terms to verify parsing correctness with GraphDB 12.
* Earlier versions (GraphDB 11 and earlier) remain fully supported with RDF 1.1.

## 4.1.0 (2026-10-30)
* Tested with GraphDB 11.5.2. Since GraphDB 11.4.0, the repository configuration contains the `storageEncryption` parameter.
* Documented creating repositories encrypted at rest with the `storageEncryption` parameter (GraphDB 11.4+).
* Added `GraphDBServerClient.rotateDataEncryptionKey` for rotating the data encryption key of an encrypted repository (GraphDB 11.4+).
* Documented the user roles, additional permissions and custom roles for `GraphDBServerClient.createUser`, `GraphDBServerClient.updateUser` and `GraphDBServerClient.updateFreeAccess`, including the repository maintain permission `MAINTAIN_REPO_{repository ID}` (GraphDB 11.5+).
* Fixed the values of the internal `Authority` enum (`lib/security/authority`) to the spelling GraphDB accepts (`ROLE_ADMIN`, `ROLE_REPO_MANAGER`, `ROLE_USER`, `READ_REPO_`, `WRITE_REPO_`); GraphDB rejected the previous values with `400`. Added `MONITORING`, `CLUSTER`, `CUSTOM_ROLE_PREFIX`, `MAINTAIN_REPO_PREFIX` and `GRAPHQL_ONLY_SUFFIX`.
* Fixed `AddStatementPayload` sending literal data types with the `xsd:` prefix, such as the values of `Types.XSD` and the data types that `setObjectLiteral` detects for numbers and booleans, as the IRI `xsd:integer` instead of `http://www.w3.org/2001/XMLSchema#integer`. GraphDB stored these literals with the wrong data type, so they were not numeric and did not match a query by value such as `ASK { ?s ?p 5 }`. The `xsd:` prefix is now expanded to the XSD namespace. Data added earlier this way keeps the wrong data type and has to be fixed in the repository, for example with this SPARQL update, which fixes the named graphs first and then the default graph:
  ```sparql
  DELETE { GRAPH ?g { ?s ?p ?o } } INSERT { GRAPH ?g { ?s ?p ?fixed } }
  WHERE {
    GRAPH ?g { ?s ?p ?o }
    FILTER(isLiteral(?o) && STRSTARTS(STR(DATATYPE(?o)), "xsd:"))
    BIND(STRDT(STR(?o), IRI(CONCAT("http://www.w3.org/2001/XMLSchema#", STRAFTER(STR(DATATYPE(?o)), "xsd:")))) AS ?fixed)
  };
  DELETE { ?s ?p ?o } INSERT { ?s ?p ?fixed }
  WHERE {
    ?s ?p ?o
    FILTER(isLiteral(?o) && STRSTARTS(STR(DATATYPE(?o)), "xsd:"))
    BIND(STRDT(STR(?o), IRI(CONCAT("http://www.w3.org/2001/XMLSchema#", STRAFTER(STR(DATATYPE(?o)), "xsd:")))) AS ?fixed)
  }
  ```
* Fixed `GraphDBServerClient` retrying requests endlessly after a `401` response: when the server rejected the token (for example after a GraphDB restart, which regenerates the token secret since 11.5.2) or the login failed, the client did not log in again.
* Fixed `RDFRepositoryClient` and `TransactionalRepositoryClient` without credentials failing with `TypeError: Cannot read properties of undefined (reading 'clearToken')` on a `401` response, for example against a GraphDB with security enabled. They now reject with the `401` error, like `GraphDBServerClient`.
* Fixed a regression in 3.1.0: `RDFRepositoryClient.upload` and `RDFRepositoryClient.addFile` replaced the repository data instead of adding to it. In 3.1.0–4.0.0 they sent `PUT` instead of `POST` to `/statements`, so they deleted the existing statements, like `overwrite` and `putFile`: all statements when no context was given, including those in named graphs, or the statements in the given context. `TransactionalRepositoryClient` was not affected.
* Fixed `RDFRepositoryClient.overwrite` and `RDFRepositoryClient.putFile` keeping the connection open until the read timeout, which kept the Node.js process alive after the request completed.
* Fixed `RDFRepositoryClient.get` and `TransactionalRepositoryClient.get` decoding binary RDF (`RDFMimeType.BINARY_RDF`) as UTF-8 text, which corrupted data with non-ASCII characters: uploading it back failed with `400 MALFORMED DATA`. They now resolve with a `Buffer`.
* Fixed `RepositoryClientConfig` ignoring the server base URL for relative repository endpoints: endpoints such as `/repositories/my-repo` are now prefixed with the URL passed to the constructor. Absolute endpoints are used unchanged.
* Fixed `GraphDBServerClient` not URL-encoding the username in the `createUser`, `updateUser`, `updateUserData`, `getUser` and `deleteUser` requests and the `location` query parameter. A username with `#` or `?` sent the request to another user (`deleteUser('a#b')` deleted the user `a`), `+` was read as a space and `%` was rejected with `400`; a location with `&` was cut. The username is encoded as in the GraphDB Workbench, except for `/`, which GraphDB rejects when encoded. A username with `%` still works only when security is disabled: with security enabled, GraphDB rejects it in the path with `400`. A caller who encoded the username or location before passing it must stop doing so, or it is encoded twice.
* Fixed the GraphDB token authentication (`useGdbTokenAuthentication`) failing for a username with `#`, `?`, `+` or `%`: the client now logs in with `POST /rest/login` and the username and password in a JSON body, as the GraphDB Workbench does, instead of putting the username in the URL path.
* Fixed `TransactionalRepositoryClient.query` and `TransactionalRepositoryClient.update` failing with the `application/x-www-form-urlencoded` content type, the default for `GetQueryPayload`: GraphDB answered `503 Query execution interrupted` to queries and `406 Could not read SPARQL update string from body` to updates. In a transaction, the query is now sent as an `application/sparql-query` or `application/sparql-update` body and the other payload parameters in the URL.
* Raised the minimum Node.js version to 18 (`engines.node` is `>=18`, was `>=14.17.0`); the library is tested with Node.js 22. npm only warns on an older Node.js, but Yarn 1 refuses to install the package.

## 4.0.0 (2025-08-20)
* GraphDB 11 support. Tested with GraphDB 11.0.2.

## 3.1.0 (2025-05-19)
* Added `RepositoryClientConfig.setLocation` for working with repositories of a remote
  GraphDB instance. The location is sent in the `x-graphdb-repository-location` header;
* Fixed an issue where a 400 error occurred when attempting to execute long queries;
* Fixed issues where some methods in graphdb.js were not properly utilizing the repository 
  location parameter, causing incorrect behavior when working with repositories that are 
  not located in the default location.
* Resolved a problem with UploadService where the request remained active until timeout, 
  even after a successful RDF statement upload;
* Addressed an issue reported by clients where type definitions were not accessible in versions after 3.0.0;
* Updated dependencies to fix the latest security vulnerabilities and improve performance and stability.

## 3.0.4 (2024-06-19)
* When executing a query with a POST request and a valid QueryPayload, 
regardless of the content type, the parameters will be included in the request.

## 3.0.3 (2024-06-18)
* No changes, the same as 3.0.2.

## 3.0.2 (2024-02-14)
* When the back-end server returns 401, a new attempt to log in will be made, in order to fetch a new token.
  
## 3.0.1 (2023-07-18)
* Fix passing of credentials to the TransactionalRepositoryClient configuration, if set in the RepositoryClientConfig
* Moved `typescript` from the dev dependencies to the dependencies

## 3.0.0 (2023-03-24)
**Breaking changes**
This version won't work with GDB<10 due to changes in the REST API.
* GDB 10 support.
  * Changes in the services internal implementation to match the changes in the GDB REST API
  which are mainly syntactic changes in the endpoints at least in these supported by this 
    library.
* Updates in the readme.

## 2.0.2 (2022-06-08)
* No changes in the library, the same as 2.0.1. Fixed the release pipeline.

## 2.0.1 (2022-06-08)
* Updated the third party dependencies to fix high CVEs
* Updated `n3`
* Documented value bindings in queries in the README

## 2.0.0 (2021-02-10)
* Major changes in the construction of server and repository client configurations.
* Update Readme.md

## 1.7.0 (2021-02-10)
* Upgrade to graphDb 9.6.0

## 1.6.1 (2021-02-09)
**Bugfixes**
* Repository client authentication endpoint fix

## 1.6.0 (2021-01-15)
* Authenticate against a secured GDB server
* Manage repositories through GraphDBServerClient
* Fix latest vulnerabilities and lib updates
* Migrate to Jenkins
* Update repository tutorials in Readme.md
* Created README for the e2e-test package
  
## 1.5.0 (2020-12-10)
* Upgrade to graphDb 9.5.0

## 1.4.0 (2020-12-10)
* Upgrade GDB to 9.4.0 and fix tests
* Fix latest vulnerabilities in tests

## 1.3.0 (2020-12-09)
* Upgrade to graphDb 9.3.0

## 1.2.2 (2020-12-09)
**Improvements**
* Implement authentication

**Bug fixes**

* Update library vulnerabilities

## 1.2.1 (2020-09-09)
* Fix security dependency issues

## 1.2.0 (2020-04-24)
**Changes**
* RDFStar support added
* RDFStar e2e tests added 

**Bug fixes**
* fixed e2e tests graphdb.js dependency

## 1.1.1 (2019-09-19)
**Changes**
* Updated to GraphDB Free version 8.11.0 for the acceptance tests
* Stabilised acceptance tests
* Configured Travis to deploy once
* Updated NPM packages 

**Bug fixes**
* Increase maxContentLength in axios 

## 1.1.0 (2019-06-27)
**Improvements**

* Reduce code duplication
* Update libraries to account security issues reported by snyk
* Added E2E acceptance tests as part of the build 

**Bugfixes**

* GraphDB java script driver cannot upload ttl files larger than 10mb

## 1.0.0 (2019-05-29)
* Reading data (SPARQL/RDF4J protocols).
* Consume SPARQL Query results with Node streams.
* Writing data (SPARQL/RDF4J protocols (POST+PUT)). 
* Delete data (RDF4J protocols).
* Context (i.e. named graph) & namespace management (RDF4J).
* Transactions (RDF4J).
* Compliant with [RDFJS](http://rdf.js.org/data-model-spec/) by plugable parsers.
* Support multiple GDB endpoints to ensure high-availability - there should be a
list of endpoints iterated by the client if one of them fails. Always test the 
first endpoint and if it fails, switch to the next endpoint.
* Allow configuring the HTTP connect and response timeout value so the user can 
give up requests failing to return a result in the expected time.
* Add X-Request-id to each client request.
* Consistent structured logging mechanism in JSON format.
