const axios = require('axios');
const HttpClient = require('http/http-client');
const HttpRequestBuilder = require('http/http-request-builder');

jest.mock('axios');

const X_REQUEST_ID_HEADER = 'x-request-id';

/*
 * Tests the wrapping of axios in HttpClient and how it delegates requests.
 */
describe('HttpClient', () => {

  let axiosMock;
  let httpClient;
  let requestBuilder;

  beforeEach(() => {
    axios.mockReset();

    // Stub axios.create to return a mock of axios
    axiosMock = jest.genMockFromModule('axios');
    axios.create.mockImplementation((defaults) => {
      axiosMock.defaults = defaults;
      return axiosMock;
    });

    // Stub methods to return promises
    axiosMock.request.mockResolvedValue();

    requestBuilder = HttpRequestBuilder.httpGet('/api/resources')
      .setParams({
        'param-1': 'value-1'
      }).setHeaders({
        'Accept': 'application/json'
      });

    httpClient = new HttpClient('/base/url')
      .setDefaultReadTimeout(1000)
      .setDefaultWriteTimeout(2000);
  });

  test('should initialize the client with the supplied options', () => {
    expect(httpClient).not.toBeNull();
    expect(httpClient.axios).not.toBeNull();
    expect(axios.create).toHaveBeenCalledTimes(1);
    expect(axios.create).toHaveBeenCalledWith({
      baseURL: '/base/url',
      paramsSerializer: expect.any(Function)
    });
    expect(httpClient.readTimeout).toEqual(1000);
    expect(httpClient.writeTimeout).toEqual(2000);
  });

  test('should initialize the client with default timeout options', () => {
    httpClient = new HttpClient('/base/url');
    expect(httpClient.readTimeout).toEqual(0);
    expect(httpClient.writeTimeout).toEqual(0);
  });

  test('should allow to set default request headers', () => {
    const headers = {'Accept': 'application/json'};
    httpClient.setDefaultHeaders(headers);
    expect(axiosMock.defaults.headers).toEqual(headers);
  });

  test('should properly serialize query parameters', () => {
    const paramsSerializer = axios.create.mock.calls[0][0].paramsSerializer;
    expect(paramsSerializer({
      'param-1': 'a',
      'param-2': ['b', 'c', 'd', 'null', undefined],
      'param-3': undefined,
      'param-4': null
    })).toEqual('param-1=a&param-2=b&param-2=c&param-2=d&param-2=null');
  });

  test('should expose its base URL', () => {
    expect(httpClient.getBaseURL()).toEqual('/base/url');
  });

  describe('request()', () => {
    test('should perform request with the supplied http request builder', () => {
      return httpClient.request(requestBuilder).then(() => {
        expect(axiosMock.request).toHaveBeenCalledTimes(1);
        expect(axiosMock.request).toHaveBeenCalledWith(requestBuilder.config);
      });
    });

    test('should add x-request-id header', () => {
      return httpClient.request(requestBuilder).then(() => {
        expect(axiosMock.request.mock.calls[0][0].headers).toHaveProperty(X_REQUEST_ID_HEADER);
      });
    });

    test('should add default read timeout to request configuration', () => {
      return httpClient.request(requestBuilder).then(() => {
        expect(axiosMock.request.mock.calls[0][0].timeout).toEqual(1000);
      });
    });

    test('should add default write timeout to request configuration', () => {
      requestBuilder.setMethod('post');
      return httpClient.request(requestBuilder).then(() => {
        expect(axiosMock.request.mock.calls[0][0].timeout).toEqual(2000);
      });
    });

    test('should not add default read timeout to request configuration if already provided', () => {
      requestBuilder.setTimeout(500);
      return httpClient.request(requestBuilder).then(() => {
        expect(axiosMock.request.mock.calls[0][0].timeout).toEqual(500);
      });
    });

    test('should not add default write timeout to request configuration if already provided', () => {
      requestBuilder.setMethod('post');
      requestBuilder.setTimeout(500);
      return httpClient.request(requestBuilder).then(() => {
        expect(axiosMock.request.mock.calls[0][0].timeout).toEqual(500);
      });
    });
  });
});
