# CHANGELOG

## Next:
* `Consume SPARQL Query results with iterator.`
* `Optional: Cluster management - add, remove, stop, check cluster status (GDB API)`
* `Check the GDB server version and report mismatches if the client version implements a different version unless the check is stopped.`
* `Support secured endpoints exposing only HTTPS`

## Unreleased
* Fix passing of credentials to the TransactionalRepositoryClient configuration, if set in the RepositoryClientConfig
* Enable static code analysis in the Jenkins pipeline and updated GraphDB version in docker-compose file
* Updated third party libraries and fixed vulnerabilities
* Changed TS types generation to use TypeScript

## 3.0.4 (2024-06-19)
* When executing a query with a POST request and a valid QueryPayload, 
regardless of the content type, the parameters will be included in the request.

## 3.0.2 (2024-02-14)
* When the back-end server returns 401, a new attempt to log in will be made, in order to fetch a new token.
  
## 3.0.0 (2023-03-24)
**Breaking changes**
This version won't work with GDB<10 due to changes in the REST API.
* GDB 10 support.
  * Changes in the services internal implementation to match the changes in the GDB REST API
  which are mainly syntactic changes in the endpoints at least in these supported by this 
    library.
* Updates in the readme.

## 2.0.0 (2021-02-10)
* Major changes in the construction of server and repository client configurations.
* Update Readme.md

## 1.7.0 (2021-02-10)
* Upgrade to graphDb 9.6.0

## 1.6.1 (2021-02-09)
* Authenticate against a secured GDB server
* Manage repositories through GraphDBServerClient
* Fix latest vulnerabilities and lib updates
* Migrate to Jenkins
* Update repository tutorials in Readme.md
* Created README for the e2e-test package

**Bugfixes**
* Repository client authentication endpoint fix
  
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
