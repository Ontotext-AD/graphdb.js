const HttpClient = require('http/http-client');
const RDFRepositoryClient = require('repository/rdf-repository-client');
const RepositoryClientConfig = require('repository/repository-client-config');
const GetStatementsPayload = require('repository/get-statements-payload');
const RDFMimeType = require('http/rdf-mime-type');
const HttpRequestBuilder = require('http/http-request-builder');

const httpClientStub = require('../http/http-client.stub');

jest.mock('http/http-client');

import data from './data/read-statements';
import userdata from '../auth/data/logged-user-data';

describe('RDFRepositoryClient - authentication', () => {
  let config;
  let repository;
  let httpRequest;
  let httpLoginRequest;

  beforeEach(() => {
    HttpClient.mockImplementation(() => httpClientStub());

    const endpoints = ['http://host/repositories/repo1'];
    const headers = {};
    const contentType = '';
    const readTimeout = 1000;
    const writeTimeout = 1000;
    const endpoint = 'http://localhost:7200';

    config = new RepositoryClientConfig(endpoint)
      .setEndpoints(endpoints)
      .setHeaders(headers)
      .setDefaultRDFMimeType(contentType)
      .setReadTimeout(readTimeout)
      .setWriteTimeout(writeTimeout)
      .useBasicAuthentication('testuser', 'pass123');
    repository = new RDFRepositoryClient(config);
    httpRequest = repository.httpClient.request;

    httpRequest.mockResolvedValue({
      config: {headers: {}}
    });

    httpLoginRequest = repository.httpClients[0].request;
    httpLoginRequest.mockResolvedValue({
      data: data.repositories.repo1.statements
        .GET['single_application/rdf+xml'],
      headers: {}
    });
  });

  afterAll(() => {
    repository.repositoryClientConfig.disableAuthentication();
  });

  const payload = new GetStatementsPayload()
    .setSubject('<http://eunis.eea.europa.eu/countries/AZ>')
    .setPredicate('<http://eunis.eea.europa.eu/rdf/schema.rdf#population>')
    .setResponseType(RDFMimeType.RDF_XML);
  const expectedResponse = '<?xml version="1.0" encoding="UTF-8"?><rdf:RDF xmlns="http://eunis.eea.europa.eu/rdf/schema.rdf#"><rdf:Description rdf:about="http://eunis.eea.europa.eu/countries/AZ"><population rdf:datatype="http://www.w3.org/2001/XMLSchema#integer">7931000</population></rdf:Description></rdf:RDF>';

  test('should fetch and return single statement as plain string', () => {
    return repository.get(payload).then((response) => {
      // check the response
      expect(response).toEqual(expectedResponse);

      // verify that exact requests have been made
      const loginMock = repository.httpClient.request;
      const requestMock = repository.httpClients[0].request;

      // expect 2 invocations: first login, second getRepositoryIDs
      expect(loginMock).toHaveBeenCalledTimes(1);
      expect(requestMock).toHaveBeenCalledTimes(1);

      // first request was a login with expected parameters
      const expectedLoginRequest = HttpRequestBuilder
        .httpGet('/rest/security/authenticated-user')
        .addAuthorizationHeader('Basic dGVzdHVzZXI6cGFzczEyMw==');
      expect(loginMock).toHaveBeenNthCalledWith(1, expectedLoginRequest);

      // second request was the API call with expected parameters
      const expectedAPIRequest = HttpRequestBuilder.httpGet('/statements')
        .setParams({
          subj: '<http://eunis.eea.europa.eu/countries/AZ>',
          pred: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>'
        })
        .addAcceptHeader(payload.getResponseType());
      expect(requestMock).toHaveBeenNthCalledWith(1, expectedAPIRequest);
    });
  });

  test('should try relogin after token gets expired', () => {
    mockClient();

    return repository.get(payload).then(() => {
      return repository.get(payload);
    }).then(() => {
      // verify that exact requests have been made
      const loginMock = repository.httpClient.request;
      const requestMock = repository.httpClients[0].request;

      // expect 2 invocations:ClientConfigBuilder
      // first login
      // second getRepositoryIDs
      // expecting 5 invocations:
      // login
      // first API call
      // second API call which fails with 401 unauthorized
      // re-login
      // third API call
      expect(loginMock).toHaveBeenCalledTimes(3);
      expect(requestMock).toHaveBeenCalledTimes(3);
    });

    function mockClient() {
      let calls = 0;

      repository.httpClients[0].request =
        jest.fn().mockImplementation((request) => {
          if (request.getMethod() === 'get') {
            calls++;
            if (repository.getLoggedUser()
              && calls === 2) {
            // emulate token expiration
              repository.getLoggedUser().clearToken();
              return Promise.reject({
                response: {
                  status: 401
                }
              });
            }
            return Promise.resolve({data: data.repositories.GET});
          } else if (request.getMethod() === 'post') {
            return Promise.resolve({
              headers: {
                authorization: 'token123'
              },
              data: userdata
            });
          }
          return Promise.reject();
        });
    }
  });
});
