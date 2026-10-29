# CHANGELOG

## Next:
* `Consume SPARQL Query results with iterator.`
* `Optional: Cluster management - add, remove, stop, check cluster status (GDB API)`
* `Check the GDB server version and report mismatches if the client version implements a different version unless the check is stopped.`
* `Support secured endpoints exposing only HTTPS`

## Unreleased
**Breaking changes**
* Node.js 18 or newer is required (`engines.node` is `>=18`, was `>=14.17.0`). Node.js 14, 16 and 18 are past their end of life, and the library is tested only with Node.js 22. npm only warns about the mismatch, but Yarn 1 refuses to install the package on an older Node.js.

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
* Fixed a regression in 3.1.0: `RDFRepositoryClient.upload` and `RDFRepositoryClient.addFile` replaced the repository data instead of adding to it. In 3.1.0–4.0.0 they sent `PUT` instead of `POST` to `/statements`, so they deleted the existing statements, like `overwrite` and `putFile`: all statements when no context was given, including those in named graphs, or the statements in the given context. `TransactionalRepositoryClient` was not affected.
* Fixed `RDFRepositoryClient.overwrite` and `RDFRepositoryClient.putFile` keeping the connection open until the read timeout, which kept the Node.js process alive after the request completed.
* Fixed `RepositoryClientConfig` ignoring the server base URL for relative repository endpoints: endpoints such as `/repositories/my-repo` are now prefixed with the URL passed to the constructor. Absolute endpoints are used unchanged.
* Fixed `GraphDBServerClient` not URL-encoding the username in the `createUser`, `updateUser`, `updateUserData`, `getUser` and `deleteUser` requests and the `location` query parameter. A username with `#` or `?` sent the request to another user (`deleteUser('a#b')` deleted the user `a`), `+` was read as a space and `%` was rejected with `400`; a location with `&` was cut. The username is encoded as in the GraphDB Workbench, except for `/`, which GraphDB rejects when encoded. A username with `%` still works only when security is disabled: with security enabled, GraphDB rejects it in the path with `400`. A caller who encoded the username or location before passing it must stop doing so, or it is encoded twice.
* Fixed the GraphDB token authentication (`useGdbTokenAuthentication`) failing for a username with `#`, `?`, `+` or `%`: the client now logs in with `POST /rest/login` and the username and password in a JSON body, as the GraphDB Workbench does, instead of putting the username in the URL path.

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
