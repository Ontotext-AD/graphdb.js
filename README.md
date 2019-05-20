# graphdb-javascript-driver (RDF4JS)

A GraphDB data access library written in JavaScript to be used in Node.js and/or 
web browser environment.  

## Installation
Make sure you have Node.js version 8 or greater and Node Package Manager 
([npm](https://npmjs.org/)) installed before start working with the library.
```
npm install --save rdf4js
```

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

#### Configuration and instantiating RDFRepositoryClient

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

#### Uploading data in repository (POST) using ReadStream

```javascript
const contentType = RDFMimeType.TURTLE;
const turtleFile = __dirname + '/statements.ttl';
fs.readFile(turtleFile, (err, stream) => {
    repository.upload(stream, null, null, contentType).catch((e) => console.log(e));
});
```

#### Overwrite data in repository (PUT) using ReadStream

```javascript
const contentType = RDFMimeType.TURTLE;
const file = __dirname + '/statements-overwrite.ttl';
fs.readFile(file, (err, stream) => {
    repository.overwrite(stream, null, null, contentType).catch((e) => console.log(e));
});
```

#### Download data from repository by consuming a WritableStream

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

#### Executing a sparql update query

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

## Setup Development

```
npm install
```

### Production build

```
npm run build
```

### Run tests

```
npm run test
```

or constantly watching for changes in source files and tests and re-execute the 
test suite

```
npm run test:watch
```

### Run lint
The library uses Google [style](https://google.github.io/styleguide/jsguide.html) in conjunction with ESLint's recommended ruleset.
```
npm run lint
```

### Prerequisites
Node > 8

### License
[LICENSE](LICENSE)
