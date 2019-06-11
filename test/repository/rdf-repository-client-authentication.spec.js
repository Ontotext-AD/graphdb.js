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

  beforeEach(() => {
    HttpClient.mockImplementation(() => httpClientStub());

    const endpoints = ['http://host/repositories/repo1'];
    const headers = {};
    const contentType = '';
    const readTimeout = 1000;
    const writeTimeout = 1000;

    config = new RepositoryClientConfig()
      .setEndpoints(endpoints)
      .setHeaders(headers)
      .setDefaultRDFMimeType(contentType)
      .setReadTimeout(readTimeout)
      .setWriteTimeout(writeTimeout)
      .setUsername('testuser')
      .setPass('pass123');
    repository = new RDFRepositoryClient(config);
    httpRequest = repository.httpClients[0].request;

    httpRequest.mockResolvedValue({
      data: data.repositories.repo1.statements.GET['single_application/rdf+xml'],
      headers: {}
    });
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
      const requestMock = repository.httpClients[0].request;

      // expect 2 invocations: first login, second getRepositoryIDs
      expect(requestMock).toHaveBeenCalledTimes(2);

      // first request was a login with expected parameters
      const expectedLoginRequest = HttpRequestBuilder.httpPost('/rest/login/testuser')
        .addGraphDBPasswordHeader('pass123');
      expect(requestMock).toHaveBeenNthCalledWith(1, expectedLoginRequest);

      // second request was the API call with expected parameters
      const expectedAPIRequest = HttpRequestBuilder.httpGet('/statements')
        .setParams({
          subj: '<http://eunis.eea.europa.eu/countries/AZ>',
          pred: '<http://eunis.eea.europa.eu/rdf/schema.rdf#population>'
        })
        .addAcceptHeader(payload.getResponseType());
      expect(requestMock).toHaveBeenNthCalledWith(2, expectedAPIRequest);
    });
  });

  test('should try relogin after token gets expired', () => {
    mockClient();

    return repository.get(payload).then((response) => {
      return repository.get(payload);
    }).then((response) => {
      // verify that exact requests have been made
      const requestMock = repository.httpClients[0].request;

      // expect 2 invocations: first login, second getRepositoryIDs
      // expecting 5 invocations:
      // login
      // first API call
      // second API call which fails with 401 unauthorized
      // re-login
      // third API call
      expect(requestMock).toHaveBeenCalledTimes(5);
    });

    function mockClient() {
      let calls = 0;

      repository.httpClients[0].request = jest.fn().mockImplementation((request) => {
        if (request.getMethod() === 'get') {
          calls++;
          if (repository.authenticationService.getLoggedUser() && calls === 2) {
            // emulate token expiration
            repository.authenticationService.getLoggedUser().clearToken();
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
