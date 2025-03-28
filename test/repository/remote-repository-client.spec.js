const RepositoryClientConfig = require('repository/repository-client-config');
const RDFRepositoryClient  = require('repository/rdf-repository-client');
const httpClientStub = require('../http/http-client.stub');
const HttpClient = require('http/http-client');

jest.mock('http/http-client');

describe('Remote GraphDB location', () => {

    let mockedHttpClients;
    beforeEach(() => {
        mockedHttpClients = [];
        HttpClient.mockImplementation(() => {
            const mockedHttpClient = httpClientStub();
            mockedHttpClients.push(mockedHttpClient);
            return mockedHttpClient;
        });
    });

    test('should set GraphDB remote location if the client sets a location', () => {
        // When: I create an RDFRepositoryClient instance with a configured location.
        const repoClientConfig = new RepositoryClientConfig('http://localhost:8080')
            .setEndpoints(['http://localhost:8080/repositories/test'])
            .setLocation('http://graphdb2:7200');
        new RDFRepositoryClient(repoClientConfig);

        // Then: I expect the HttpClient used by the created RDFRepositoryClient to have the GraphDB location header set.
        expect(mockedHttpClients[1].setDefaultHeaders).toHaveBeenCalledTimes(1);
        expect(mockedHttpClients[1].setDefaultHeaders).toHaveBeenCalledWith({
            "x-graphdb-repository-location": "http://graphdb2:7200"
        });
    });

    test("should not set the GraphDB remote location if the client doesn't set a location", () => {
        // When: I create an RDFRepositoryClient instance without a configured location.
        const repoClientConfig = new RepositoryClientConfig('http://localhost:8080')
            .setEndpoints(['http://localhost:8080/repositories/test']);
        const rdfRepositoryClient = new RDFRepositoryClient(repoClientConfig);

        // Then: I expect the HttpClient used by the created RDFRepositoryClient to don't have the GraphDB location header set.
        expect(mockedHttpClients[1].setDefaultHeaders).toHaveBeenCalledTimes(1);
        expect(mockedHttpClients[1].setDefaultHeaders).toHaveBeenCalledWith({});
    });
});
