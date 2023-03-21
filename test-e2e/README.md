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
> 
> The other and easiest way to do this is by linking the main project to test-e2e
> project by executing `npx link /home/path/to/graphdb.js/` in the 
> `graphdb.js/test-e2e` package. 
> This way the only thing which should be done is to rebuild the library
> by using `npm run build` in the root in order to get the latest version in the
> test project after each change in the source code.


## Running single test
Want to run a single test? Execute 
`jest -t "Namespaces management" --config=jest-e2e.config.js`


TODO: Update guide that these tests can be run with node 9 or above because of some error
