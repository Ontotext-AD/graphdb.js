# graphdb.js

[![Build Status](https://travis-ci.com/Ontotext-AD/graphdb.js.svg?branch=master)](https://travis-ci.com/Ontotext-AD/graphdb.js)
[![Coverage Status](https://coveralls.io/repos/github/Ontotext-AD/graphdb.js/badge.svg?branch=master)](https://coveralls.io/github/Ontotext-AD/graphdb.js?branch=master)
<a href="https://codeclimate.com/github/Ontotext-AD/graphdb.js/maintainability"><img src="https://api.codeclimate.com/v1/badges/6fffed099d25a540d504/maintainability" /></a>
[![install size](https://packagephobia.now.sh/badge?p=graphdb)](https://packagephobia.now.sh/result?p=graphdb)
[![npm version](https://badge.fury.io/js/graphdb.svg)](https://badge.fury.io/js/graphdb)

A GraphDB and RDF4J data access library written in JavaScript to be used in Node.js.  

## Installation

### Prerequisites
* Node >= 8
* NPM ([npm](https://npmjs.org/))

```
npm install graphdb
```

## Development

*Library documentation* can be found [here](https://ontotext-ad.github.io/graphdb.js/)

The library is written in ES2016. During the build process source files `src/`
are transpiled to ES2015 and copied to `lib/` directory.

A typescript definition file `types.d.ts` is generated in the `lib/` as well.

Documentation is generated in `docs/` from the JSDoc annotations in the source
code.

### Project Structure

* `src` : The source code of the library.
* `test` : Unit and component level tests written with Jest.
* `lib` : Transpiled but files are built here when the library is published to npm.
* `docs` : Documentation generated with JSDoc when the library is published to npm.
* `src/index.js` : The library external API exporting main functional classes. This is also present in `lib`.
* `lib/types.d.ts` : The typescript definitions generated when the library is published to npm.
* `scripts` : Service scripts related to building, publishing and so on.

### Setup Environment

* Checkout or clone the project.
* Make sure prerequisites are covered: node js and npm must be present and versions
should be supported.
* Enter the project directory and execute

```
npm install
```

### Running Tests
After any change the tests should be run and check if any existing functionality
is not broken in result.

```
npm run test
```

or constantly watching for changes in source files and tests and re-execute the 
test suite

```
npm run test:watch
```

### Checking the codestyle

The library uses Google [style](https://google.github.io/styleguide/jsguide.html) 
in conjunction with ESLint's recommended ruleset.

```
npm run lint
```

### Testing the packaging

Library is managed by NPM package manager. During publishing npm consults the 
`.gitignore`, `.npmignore` and `package.json#files` property in order to decide 
which resources should be published. If any change in the project structure, 
`.gitignore` or `.npmignore` is made, then publishing must be verified in order
to be guaranteed that needed sources will be properly published.
The packaging could be verified using the `npm pack` command which generates 
a `*.tgz` archive in the project root. The archive should contain only the needed
resources.
Furture the archive could be used as a source for `npm install` where the path
pointing the archive is provided.

### Publishing

* Increase the package version.
```
npm version patch|minor|major
```
* Login in npm.
```
npm login
```
* Publish package in npm.
```
npm publish
```

## Usage

### ServerClient

The `ServerClient` deals with operations on server level like obtaining a list 
with available repositories, concrete repository or deleting repositories. In 
order to work with the `ServerClient` it should be configured `ServerClientConfig`
first.

* Configure `ServerClient`

```javascript
const {ServerClient, ServerClientConfig} = require('graphdb').server;
const {RDFMimeType} = require('graphdb').http;

const serverConfig = new ServerClientConfig('http://rdf4j-compliant-server/', 0, {
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
});
const server = new ServerClient(serverConfig);
```

*  Fetch repository ids

```javascript
server.getRepositoryIDs().then(ids => {
    // work with ids
}).catch(err => console.log(err));
```

* Check if repository with given name exists

```javascript
server.hasRepository('repository-name').then(exists => {
    if (exists) {
        // repository exists -> delete it for example
    }
}).catch(err => console.log(err));
```

* Delete repository with given name

```javascript
server.deleteRepository('repository-name').then(() => {
    // successfully deleted
}).catch(err => console.log(err));
```

* Although a repository instance can be created using a constructor which can be
seen in the examples below a client could obtain an instance of `RDFRepositoryClient` 
through the server client

```javascript
server.getRepository('repository-name').then(repository => {
    // repository is a configured RDFRepositoryClient instance
}).catch(err => console.log(err));
``` 

### RDFRepositoryClient

* Instantiating repository client

```javascript
const readTimeout = 30000;
const writeTimeout = 30000;
const config = new RepositoryClientConfig(['http://GDB/repositories/my-repo'], {
  'Accept': RDFMimeType.TURTLE
}, '', readTimeout, writeTimeout);
const repository = new RDFRepositoryClient(config);
```

* Obtaining repository client instance through a ServerClient

```javascript
const {ServerClient, ServerClientConfig} = require('graphdb').server;
const {RepositoryClientConfig} = require('graphdb').repository;

const config = new ServerClientConfig('http://GDB', 0, {});
const server = new ServerClient(config);

const readTimeout = 30000;
const writeTimeout = 30000;
const repositoryClientConfig = new RepositoryClientConfig(['http://GDB/repositories/my-repo'], {}, '', readTimeout, writeTimeout);
return server.getRepository('automotive', repositoryClientConfig).then((rdfRepositoryClient) => {
// rdfRepositoryClient is a configured instance of RDFRepositoryClient
});
```

#### Reading

Statements could be fetched using the `RDFRepositoryClient.get`, `RDFRepositoryClient.query`, 
`RDFRepositoryClient.download`. 

Every reading method can get the response parsed to data objects according to 
[RDFJS](http://rdf.js.org/data-model-spec/) data model specification (see [Response Parsers](#response-parsers)).

* Reading statements

```javascript
const payload = new GetStatementsPayload()
	.setResponseType(RDFMimeType.RDF_JSON)
	.setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
	.setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
	.setObject('"7931000"^^http://www.w3.org/2001/XMLSchema#integer')
	.setContext('<http://example.org/graph3>')
	.setInference(true);

return repository.get(payload).then((data) => {
	// data contains requested staments in rdf json format
});
```

* Downloading data from repository by consuming a WritableStream

```javascript
const dest = __dirname + '/statements.ttl';
const output = fs.createWriteStream(dest);
const payload = new GetStatementsPayload()
    .setResponseType(RDFMimeType.TURTLE)
    .get();
repository.download(payload).then((response) => {
    response.on('data', (chunk) => {
        output.write(new Buffer(chunk));
    });
    response.on('end', () => {
        output.end();
    });
});
```

* Query evaluation against a sparql endpoint

 * SELECT query returning data objects

```javascript
repository.registerParser(new SparqlXmlResultParser());

const payload = new GetQueryPayload()
  .setQuery('select * where {?s ?p ?o}')
  .setQueryType(QueryType.SELECT)
  .setResponseType(RDFMimeType.SPARQL_RESULTS_XML)
  .setLimit(100);

return repository.query(payload).then((stream) => {
  stream.on('data', (bindings) => {
    // the bindings stream converted to data objects with the registered parser
  });
  stream.on('end', () => {
    // handle end of the stream
  });
});
```

 * ASK query returning a boolean result

```javascript
const payload = new GetQueryPayload()
  .setQuery('ask {?s ?p ?o}')
  .setQueryType(QueryType.ASK)
  .setResponseType(RDFMimeType.BOOLEAN_RESULT);

repository.registerParser(new SparqlJsonResultParser());

return repository.query(payload).then((data) => {
  // data => true|false
});
```

#### Writing

* Uploading data in repository (POST) using ReadStream

```javascript
const contentType = RDFMimeType.TURTLE;
const turtleFile = __dirname + '/statements.ttl';
fs.readFile(turtleFile, (err, stream) => {
    repository.upload(stream, null, null, contentType).catch((e) => console.log(e));
});
```

* Overwriting data in repository (PUT) using ReadStream

```javascript
const contentType = RDFMimeType.TURTLE;
const file = __dirname + '/statements-overwrite.ttl';
fs.readFile(file, (err, stream) => {
    repository.overwrite(stream, null, null, contentType).catch((e) => console.log(e));
});
```

* Executing a sparql update query

```javascript
const payload = new UpdateQueryPayload()
  .setQuery('INSERT {?s ?p ?o} WHERE {?s ?p ?o}')
  .setContentType(QueryContentType.X_WWW_FORM_URLENCODED)
  .setInference(true)
  .setTimeout(5);

return repository.update(payload).then(() => {
    // repository should have been updated at this point
});
```

#### Deleting

* Delete statement from given context

```javascript
repository.deleteStatements(subj, pred, obj, contexts).then(() => {

});
```

### Transactions

Repository operations can be executed in transaction. In order to work with 
transactions the `TransactionalRepositoryClient` is used.

#### Starting a transaction

`RDFRepositoryClient` can initiate a transaction via `beginTransaction()` which 
produces an instance of `TransactionalRepositoryClient`. 

Each started transaction allows to be committed or rolled back by using 
respectively `commit()` and `rollback()`

The following is a short use example of a transaction:
```javascript
const turtlePath = __dirname + '/statements.ttl';

let transactionClient;
return repository.beginTransaction().then((transaction) => {
  transactionClient = transaction;
  return transactionClient.addFile(turtlePath);
}).then(() => {
  // File upload was successful, commit the changes
  return transactionClient.commit();
}).catch((e) => {
  console.log(e);
  if (transactionClient) {
    // Couldn't upload the file, abort the transaction
    return transactionClient.rollback();
  }
  return Promise.reject(e);
});
```

For specific isolation level use `TransactionIsolationLevel` 
```javascript
return repository.beginTransaction(TransactionIsolationLevel.READ_UNCOMMITTED);
```

The default isolation level is specific for each store implementation. 

**Important:** After commit or rollback, a transaction cannot be reused, any 
attempts will result in an error. If you are not sure what is the state of the 
transaction, you can use `transaction.isActive()`

#### Working with a transaction

Almost all of the transaction methods for reading & modifying data have the same 
syntax and parameters as those in `RDFRepositoryClient`.

##### Reading

`TransactionalRepositoryClient` supports the following methods for reading data, 
including any changes that are not yet committed: 

* `getSize()`
* `get()`
* `download()`
* `query()`

##### Writing

* `add()`
* `addQuads()`
* `upload()`
* `addFile()`

#### Deleting

Deleting data during a transaction is different than the one in 
`RDFRepositoryClient`, it expects RDF data document instead of statements 
filter parameters.

Currently it supports only Turtle or TriG formatted RDF data:
```javascript
const turtlePath = __dirname + '/statements.ttl';
const turtleData = fs.readFileSync(turtlePath, 'utf8');
return transaction.deleteData(turtleData);
```

### Namespaces

* Retrieving all available namespace declarations. The resolved value is an 
array of `Namespace` instances.
```javascript
return repository.getNamespaces().then((namespaces) => {
  namespaces.forEach((namespace) => {
    console.log(namespace.getPrefix() + ' -> ' + namespace.getNamespace());
   });
})
```

* Retrieving specific namespace declaration
```javascript
return repository.getNamespace('rdf').then((namespace) => {
  console.log(namespace);
})
```

* Setting the namespace declaration. This can act as create or update:
```javascript
return repository.saveNamespace('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#');
```

* Deleting specific namespace declaration
```javascript
return repository.deleteNamespace('rdf');
```

* Deleting all namespaces declarations
```javascript
return repository.deleteNamespaces();
```

### Repository management

Repository operations like create, edit, delete, shutdown are not supported by the library at the moment. Supporting these is planned for next versions. Follow the [issue](https://github.com/Ontotext-AD/graphdb.js/issues/25).

### Authorization

#### JWT

If the library is going to be used agains a secured server, then all API calls must be authenticated by sending an http authorization header with a token which is obtained after a call to `rest/login/user_name` with a password provided as a specific header.

In case the server requires that requests should be authenticated, then in the `ServerClientConfig` and `RepositoryClientConfig` must be configured the `username` and `password` which to be used for the authentication. If those are provided, then the client assumes that authentication is mandatory and the login with the provided credentials is performed authomatically before the first API call. After a successful login, user details which are received and the JWT auth token are stored in the `AuthenticationService`. From that moment on, with every API call is sent also an `authorization` header with the JWT token as value.
##### ServerClient
```javascript
 const headers = {'Accept': 'text/plain'};
 const config = new ServerClientConfig('/endpoint', 1000, headers, 'testuser', 'P@sw0rd');
```
##### RepositoryClient
```javascript
const endpoints = ['http://host/repositories/repo1'];
const headers = {};
const contentType = '';
const readTimeout = 1000;
const writeTimeout = 1000;

const config = new RepositoryClientConfig()
  .setEndpoints(endpoints)
  .setHeaders(headers)
  .setDefaultRDFMimeType(contentType)
  .setReadTimeout(readTimeout)
  .setWriteTimeout(writeTimeout)
  .setUsername('testuser')
  .setPass('pass123');
const repository = new RDFRepositoryClient(config);
const httpRequest = repository.httpClients[0].request;
````
If the JWT token expires, then the first API call will be rejected with an http error with status `401`. The client handles this automatically by re-login the user with the same credentials, updates the stored token and retries the API call. This behavior is the default and can be changed if the `ServerClientConfig` or `RepositoryClientConfig` are configured with `keepAlive=false`.


> **Note:**  
> JWT is serialized as “Authorization: GDB” header in every request, so it is vulnerable to a man-in-the-middle attack. Everyone who intercepts the JWT can reuse the session. To prevent this, we recommend to always enable encryption in transit.

#### Basic Authentication¶
Instead of using JWT, users can access secured GraphDB by passing valid base-64 encoded username:password combinations as a header.
In case Basic authentication will be used, then the headers in the `ServerClientConfig` and `RepositoryClientConfig` must be configured to send the `username` and `password` which to be used for the authentication. From this moment on, with every API call is sent also an `authorization` header with the encoded credentials as value.
```javascript
config.setBasicAuthentication('admin:root');
```

> **Note:**  
> Basic Authentication is even more vulnerable to man-in-the-middle attacks than JWT! Anyone who intercepts your requests will be able to reuse your credentials indefinitely until you change them. Since the credentials are merely base-64 encoded, they will also get your username and password. This is why it is very important to always use encryption in transit.

### Response Parsers

Read responses of different content types might be parsed to data objects with
parsers registered in the repository instance.

The library provides a way parsers to be implemented and registered with given
repository instance which in turn will use them to parse the response before
returning it to the client.

#### Implementing a custom parser

A parser could be implemented by extending the `ContentParser` and implementing
the `parse` and `getSupportedType` methods.

```javascript
class RdfAsJsonParser extends ContentParser {
  getSupportedType() {
    return 'application/rdf+json';
  }

  parse(content) {
    // parse and return the content
    return parsedContent;
  }
}
```

The `getSupportedType` method must return one of the supported RDF and SPARQL
MIME types this way defining that the parser is responsible for converting from
that type. 

#### Registering parser in the repository

Parsers should be registered in the repository before executing any request.

```javascript
// Import any of the predefined parsers
const {NTriplesParser} = require('graphdb').parser;
// And register it in the repository
repository.registerParser(new NTriplesParser());
```

Multiple parsers could be registered for different response types. 

`Registering a second parser for same content type results in overriding the previously registerted parser!`

#### Predefined parsers

The library provides convenient parser wrappers for the rdf formats using third party libraries:

* `text/turtle`: TurtleParser ([N3](https://github.com/rdfjs/N3.js))
* `text/rdf+n3`: N3parser ([N3](https://github.com/rdfjs/N3.js))
* `text/x-nquads`: NQuadsParser ([N3](https://github.com/rdfjs/N3.js))
* `text/plain` (`N-Triples`): NTriplesParser ([N3](https://github.com/rdfjs/N3.js))
* `application/x-trig`: TrigParser ([N3](https://github.com/rdfjs/N3.js))
* `application/ld-json`: JsonLDParser ([jsonld-streaming-parser](https://github.com/rubensworks/jsonld-streaming-parser.js))
* `application/rdf+xml`: RDFXmlParser ([rdfxml-streaming-parser](https://github.com/rdfjs/rdfxml-streaming-parser.js))

For SELECT query results in `json` and `xml` formats as well as boolean results from ASK queries following parsers are wrapped and exposed:
* `application/sparql-results+xml`, `text/boolean`: SparqlXmlResultParser ([sparqlxml-parse](https://github.com/rubensworks/sparqlxml-parse.js))
* `application/sparql-results+json`, `text/boolean`: SparqlJsonResultParser ([sparqljson-parse](https://github.com/rubensworks/sparqljson-parse.js))

### rdf*/sparql*
 The library provides basic support of extend RDF with a notion of nested triples, also known as [reification](https://www.w3.org/TR/rdf-mt/#Reif).
 Parsers for RDFStar triples are planned for next versions.
 
 When used against server with RDFStar support, for SELECT queries the following Mime-Types are used:
 * `application/x-sparqlstar-results+json`
 * `application/x-sparqlstar-results+tsv`
  
 For DESCRIBE and CONSTRUCT queries, the following Mime-Types can be used:
 * `application/x-turtlestar`
 * `application/x-trigstar`
 
 ```javascript
const payload = new GetQueryPayload()
     .setQuery('describe <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>')
     .setQueryType(QueryType.DESCRIBE)
     .setResponseType(RDFMimeType.TRIG_STAR)
     .setLimit(100);

return repository.query(payload).then((stream) => {
     stream.on('data', (data) => {
       	// data contains requested statements in trig star format
     });
});
```

When RDFStart triple is requested with non supportive Mime-Types, it resolves to an encoded Base64url string.
It can be decoded using `TermConverter` util class.
 ```javascript
const payload = new GetQueryPayload()
     .setQuery('describe <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>')
     .setQueryType(QueryType.DESCRIBE)
     .setResponseType(RDFMimeType.RDF_XML)
     .setLimit(100);

repository.registerParser(new RDFXmlParser());
return repository.query(payload).then((stream) => {
     stream.on('data', (data) => {
        console.log(data.subject.value);
       	// urn:rdf4j:triple:PDw8aHR0cDovL3d3dy53aWtpZGF0YS5vcmcvZW50aXR5L1E0NzI-IDxodHRwOi8vd3d3Lndpa2lkYXRhLm9yZy9wcm9wL2RpcmVjdC9QMTg4OT4gPGh0dHA6Ly93d3cud2lraWRhdGEub3JnL2VudGl0eS9RMjAyOTA0Pj4-

        console.log(TermConverter.fromBase64RdfStarTriple(data.subject.value));
        // <<<http://www.wikidata.org/entity/Q472> <http://www.wikidata.org/prop/direct/P1889> <http://www.wikidata.org/entity/Q202904>>>
     });
});
```

### License
[LICENSE](LICENSE)
