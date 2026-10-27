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
`localhost:7200`. You can run one using the `docker-compose.yml` in the root
directory by executing: `GRAPHDB_VERSION=11.5.2 docker compose -f docker-compose.yml up -d`.
The compose file expects a GraphDB license in `graphdb.license` in the root directory.
It also configures the test master key `test-e2e/encryption/test-master.key`, which the
encrypted repository tests need. When you run GraphDB in another way, start it with
`-Dgraphdb.data.encryption.type=file -Dgraphdb.data.encryption.file=<path to the key>`.
The GraphDB version used in CI is set with `GDB_VERSION` in the root `.env` file.
* To run the tests against GraphDB on another address, set the `GRAPHDB_URL`
environment variable, e.g. `GRAPHDB_URL=http://localhost:7210 npm run test`.
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
