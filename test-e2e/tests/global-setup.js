const axios = require('axios');
const Config = require('./config');
const Utils = require('./utils');

const READY_TIMEOUT = 120000;
const WARM_UP_TIMEOUT = 60000;
const WARM_UP_REPO = Utils.uniqueName('Warm_up_repo');

/**
 * Waits for GraphDB to answer REST requests and warms it up before the tests.
 *
 * The first repository created on a freshly started GraphDB is several times
 * slower than the next ones, which can exceed the request timeouts of the
 * first test suite.
 *
 * @return {Promise} resolves when GraphDB is ready
 */
module.exports = function setup() {
  return waitForGraphDB(Date.now() + READY_TIMEOUT)
    .then(() => Utils.createRepo(Config.testRepoPath,
      {id: WARM_UP_REPO, timeout: WARM_UP_TIMEOUT}))
    .then(() => Utils.deleteRepo(WARM_UP_REPO));
};

function waitForGraphDB(deadline) {
  return axios.get(`${Config.serverAddress}/rest/repositories`, {timeout: 5000})
    .catch((e) => {
      if (Date.now() > deadline) {
        throw new Error(
          `GraphDB at ${Config.serverAddress} is not ready: ${e.message}`);
      }
      return new Promise((resolve) => setTimeout(resolve, 2000))
        .then(() => waitForGraphDB(deadline));
    });
}
