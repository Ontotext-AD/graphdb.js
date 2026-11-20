const {loadFile} = require('../utils');

class GraphdbServerStubs {
  static stubRequest(server, data, method = 'get') {
    server.httpClient.axios.request = jest.fn().mockImplementation((config) => {
      expect(config.method).toBe(method);
      return Promise.resolve({
        data
      });
    });
  }

  static stubGetRepositoriesRequest(server, pathToResponseFile = 'server/data/graphdb-server-get-local-repositories-response.json') {
    GraphdbServerStubs.stubRequest(server, JSON.parse(loadFile(pathToResponseFile)));
  }

  // Mimics /rest/repositories/all, which returns every location regardless of the location parameter
  static stubGetAllRepositoriesRequest(server) {
    const local = JSON.parse(loadFile('server/data/graphdb-server-get-local-repositories-response.json'));
    const remote = JSON.parse(loadFile('server/data/graphdb-server-get-remote-repositories-response.json'));
    GraphdbServerStubs.stubRequest(server, Object.assign({}, local, remote));
  }

  static stubGetUserRequest(server, pathToResponseFile = 'server/data/graphdb-server-get-user-response.json') {
    GraphdbServerStubs.stubRequest(server, JSON.parse(loadFile(pathToResponseFile)));
  }
}

module.exports = GraphdbServerStubs;
