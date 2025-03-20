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

    static stubGetUserRequest(server, pathToResponseFile = 'server/data/graphdb-server-get-user-response.json') {
        GraphdbServerStubs.stubRequest(server, JSON.parse(loadFile(pathToResponseFile)));
    }
}

module.exports = GraphdbServerStubs;
