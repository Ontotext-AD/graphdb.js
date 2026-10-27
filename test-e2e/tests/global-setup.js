const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const Config = require('./config');

const READY_TIMEOUT = 120000;
const WARM_UP_TIMEOUT = 60000;
const WARM_UP_REPO = 'Test_repo';

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
    .then(() => createRepo(Config.testRepoPath))
    .then(() => axios.delete(
      `${Config.serverAddress}/rest/repositories/${WARM_UP_REPO}`));
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

function createRepo(path) {
  const data = new FormData();
  data.append('config', fs.createReadStream(path));
  return axios.post(`${Config.serverAddress}/rest/repositories?local=true`,
    data, {
      timeout: WARM_UP_TIMEOUT,
      headers: data.getHeaders()
    });
}
