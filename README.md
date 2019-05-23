# graphdb-javascript-driver (RDF4JS)

A GraphDB data access library written in JavaScript to be used in Node.js and/or 
web browser environment.  

## Installation
Make sure you have Node.js version 8 or greater and Node Package Manager 
([npm](https://npmjs.org/)) installed before start working with the library.

```
npm install --save rdf4js
```

## Development

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

The best and preferred way a new feature or changes to be introduced is a test
case to be written first and then the change to be implemented following the TDD
approach.

### Checking the codestyle
The library uses Google [style](https://google.github.io/styleguide/jsguide.html) 
in conjunction with ESLint's recommended ruleset.

```
npm run lint
```

### Production build
The library is written in ES2016. During the build process source files `src/`
are transpiled to ES2015 and copied to `lib/` directory.

A typescript definition file `types.d.ts` is generated in the `lib/` as well.

Documentation is generated in `docs/` from the JSDoc annotations in the source
code.

```
npm run build
```

### Testing the packaging
Library is managed by NPM package manager. During publishing npm consults the 
`.gitignore`, `.npmignore` and `package.json#files` property in order to decide 
which resources should be published. If any change in the project structure, 
`.gitignore` or `.npmignore` is made, then publishing must be verified in order
to be guaranteed that needed sources will be properly published.
The packaging could be verified using the `npm package` command which generates 
a `*.tgz` archive in the project root. The archive should contain only the needed
resources.
Furture the archive could be used as a source for `npm install` where the path
pointing the archive is provided.

### Prerequisites
Node >= 8.16

## Development

### Setup Environment

* Checkout or clone the project.
* Make sure prerequisites are covered: node js and npm must be present and versions
should be supported.
* Enter the project directory and execute

```
npm install
```

### Run tests
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

The best and preferred way a new feature or changes to be introduced is a test
case to be written first and then the change to be implemented following the TDD
approach.

### Run lint
The library uses Google [style](https://google.github.io/styleguide/jsguide.html) 
in conjunction with ESLint's recommended ruleset.

```
npm run lint
```

### Production build
The library is written in ES2016. During the build process source files `src/`
are transpiled to ES2015 and copied to `lib/` directory.

A typescript definition file `types.d.ts` is generated in the `lib/` as well.

Documentation is generated in `docs/` from the JSDoc annotations in the source
code.

```
npm run build
```

### Testing the packaging
Library is managed by NPM package manager. During publishing npm consults the 
`.gitignore`, `.npmignore` and `package.json#files` property in order to decide 
which resources should be published. If any change in the project structure, 
`.gitignore` or `.npmignore` is made, then publishing must be verified in order
to be guaranteed that needed sources will be properly published.
The packaging could be verified using the `npm package` command which generates 
a `*.tgz` archive in the project root. The archive should contain only the needed
resources.
Furture the archive could be used as a source for `npm install` where the path
pointing the archive is provided.

## Usage

### ServerClient
The `ServerClient` deals with operations on server level like obtaining a list 
with available repositories, concrete repository or deleting repositories. In 
order to work with the `ServerClient` it should be configured `ServerClientConfig`
first.

* Configure `ServerClient`

```javascript
const {ServerClient, ServerClientConfig} = require('rdf4js').server;
const {RDFMimeType} = require('rdf4js').http;

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
        // reposiotry exists -> delete it for example
    }
}).catch(err => console.log(err));
```

* Delete repository with given name

```javascript
server.deleteReposiotry('repository-name').then(() => {
    // successfully deleted
}).catch(err => console.log(err));
```

* Although a repository instance can be created using a constructor which can be
seen in the examples below a client could obtain an instance of `RDFRepositoryClient` 
through the server client

```javascript
server.getReposiotry('repository-name').then(repository => {
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
const ServerClient = require('server/server-client');
const ServerClientConfig = require('server/server-client-config');
const RepositoryClientConfig = require('repository/repository-client-config')

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
Statements could be fetched using the `RDFRepositoryClient.get`.

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

#### Response Parsers
Response might be converted to respective format if a response parser is registered 
for the configured in the payload `responseType`.

The library provides a way parsers to be implemented and registered with given
repository instance which in turn will use them to convert the response before
returning it to the client.

A parser could be implemented by extending the `ContentTypeParser` and implementing
the `parse` and `getSupportedType` methods.

```javascript
class RdfAsJsonParser extends ContentTypeParser {
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

Parsers should be registered in the repository before executing any request.

```javascript
// Import any of the predefined parsers
const {NTriplesParser} = require('rdf4js').parser;
// And register it in the repository
repository.registerParser(new NTriplesParser());
```

Multiple parsers could be registered for different response types. Registering
second parser for same type results in overriding the previously registerted 
parser.

The library provides parsers for some rdf formats using a thrid party library
[N3](https://github.com/rdfjs/N3.js).
* TurtleParser: `text/turtle`
* N3parser: `text/rdf+n3`
* NQuadsParser: `text/x-nquads`
* NTriplesParser: `text/plain` (`N-Triples`)
* TrigParser: `application/x-trig`

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
Repository operations can be executed in transaction. In order to work with transactions
the `TransactionalRepositoryClient` must be used.

`TODO`
#### Reading
#### Writing
#### Deleting

### Namespaces
`TODO`

### License
[LICENSE](LICENSE)
