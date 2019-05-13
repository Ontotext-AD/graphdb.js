# graphdb-javascript-driver (RDF4J.js)

A GraphDB data access library written in JavaScript to be used in Node.js and/or 
web browser environment.  

## Installation
Make sure you have Node.js and Node Package Manager ([npm](https://npmjs.org/)) installed before start 
working with the library.


```
npm install --save rdf4js
```

## Usage

### ServerClient

* Configure *ServerClient* and and fetch repository ids. 


```javascript
const ServerClient = require('rdf4js/src/server/server-client');
const ServerClientConfig = require('rdf4js/src/server/server-client-config');
const RDFMimeType = require('rdf4js/src/http/rdf-mime-type');

const serverConfig = new ServerClientConfig('http://rdf4j-compliant-server/', 0, {
    'Accept': RDFMimeType.SPARQL_RESULTS_JSON
});
const server = new ServerClient(serverConfig);
server.getRepositoryIDs().then(ids => {
    // work with ids
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
const RepositoryClientConfig = require('repository/repository-client-config');

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

## Setup Development
```
npm install
```

### Dev build

```
npm run build:dev
```

### Production build

```
npm run build
```

### Run tests

```
npm run test
```

### Run lint
The library uses Google [style](https://google.github.io/styleguide/jsguide.html) in conjunction with ESLint's recommended ruleset.
```
npm run lint
```

### Supported browsers

| [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/edge/edge_48x48.png" alt="IE / Edge" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/) <br/>IE / Edge | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/firefox/firefox_48x48.png" alt="Firefox" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Firefox | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/chrome/chrome_48x48.png" alt="Chrome" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Chrome | [<img src="https://raw.githubusercontent.com/alrra/browser-logos/master/src/safari/safari_48x48.png" alt="Safari" width="24px" height="24px" />](http://godban.github.io/browsers-support-badges/)<br/>Safari | 
| -------------- | --------------- | --------------- | --------------- |
| IE 10/11, Edge | last 2 versions | last 2 versions | last 2 versions |

### Prerequisites
Node > 8

### License
[LICENSE](LICENSE)
