const Utils = require('utils.js');
const Config = require('config.js');
const { RDFRepositoryClient } = require('graphdb').repository;
const { GetQueryPayload, UpdateQueryPayload, QueryType } = require('graphdb').query;
const { RDFMimeType } = require('graphdb').http;

describe('Querying long results', () => {

    const repositoryId = 'Test_repo';
    let rdfRepositoryClient = new RDFRepositoryClient(Config.restApiConfig);

    beforeAll(async () => {
        await Utils.createRepo(Config.testRepoPath);
    });

    afterAll(() => {
        return Utils.deleteRepo(repositoryId);
    });

    /**
     * This test is written to test the issue reported by a client of the graphdb.js library. See the issue here: @{link https://github.com/Ontotext-AD/graphdb.js/issues/208}.
     * The problem appeared after Merge Request {@link https://github.com/Ontotext-AD/graphdb.js/pull/206}, which fixes {@link https://github.com/Ontotext-AD/graphdb.js/issues/188#issuecomment-2015726391}.
     * After this fix, parameters are added to all requests (regardless of the request method). As a result, when there is a long query (with many characters in the query string),
     * the URL becomes excessively long and hits size limitations.
     */
    it('Should query successfully regardless of the number of results', async () => {
        //Given: There is a repository with inserted data in it.
        const insertQuery = Utils.loadFile('./data/queries/long-query/insert-data.sparql').trim();
        const insertData = new UpdateQueryPayload().setQuery(insertQuery);
        await rdfRepositoryClient.update(insertData);

        // When: I try to execute a long query.
        const selectData = new GetQueryPayload()
            .setQuery(Utils.loadFile('./data/queries/long-query/select-data.sparql').trim())
            .setQueryType(QueryType.SELECT)
            .setResponseType(RDFMimeType.SPARQL_RESULTS_JSON);

        try {
            const result = await rdfRepositoryClient.query(selectData)
                .then((response) => Utils.readStream(response));

            // Then: The result is fetched successfully without any errors
            const expectedResponse = Utils.loadFile('./data/queries/long-query/expected_long_query_results.json').trim();
            expect(result).toEqual(expectedResponse)
        } catch (error) {
            console.error(error);
            throw error;
        }
    });
});
