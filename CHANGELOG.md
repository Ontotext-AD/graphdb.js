# CHANGELOG

## Next:
* `Consume SPARQL Query results with iterator.`
* `Repository management like create, delete, edit, shutdown (two interfaces: RDF4J/GDB API)`
* `Security (GDB API) User management`
* `Optional: Cluster management - add, remove, stop, check cluster status (GDB API)`
* `Check the GDB server version and report mismatches if the client version implements a different version unless the check is stopped.`
* `Support authentication as it is implemented by the GraphDB server`
* `Support secured endpoints exposing only HTTPS`

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
