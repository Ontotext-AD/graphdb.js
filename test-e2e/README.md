# graphdb-acceptance-tests

The acceptance tests suite for the graphdb.js library.

These tests are written with the Jest testing library.

## Instructions

* The `graphdb.js` is treated as an external dependency and is installed
through the NPM registry similarly to all other dependencies 
(see the `package.json`)  
* In a terminal, navigate to `/test-e2e` and run `npm install` to install all
required dependencies.
* Make sure that you have a running GraphDB instance accessible on 
`localhost:7200`. You can run one using the `docker-compose.yml` in the same
directory by executing: `docker-compose up`.
* Run the tests with `npm run test`.
 
> Important note: For local development, you need to publish and install the 
latest `graphdb.js` either from npm or from a local package created with 
`npm pack`. This will ensure that all changes in the library will be present 
in the test package.
