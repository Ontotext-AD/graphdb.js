const axios = require('axios');
const HttpClient = require('http/http-client');
const HttpRequestConfigBuilder = require('http/http-request-config-builder');

jest.mock('axios');

const X_REQUEST_ID_HEADER = 'x-request-id';

/*
 * Tests the wrapping of axios in HttpClient and how it delegates requests.
 */
describe('HttpClient', () => {

  let axiosMock;
  let httpClient;

  let requestConfig;

  const requestData = {
    'property': 'payload'
  };

  beforeEach(() => {
    axios.mockReset();

    // Stub axios.create to return a mock of axios
    axiosMock = jest.genMockFromModule('axios');
    axios.create.mockImplementation((defaults) => {
      axiosMock.defaults = defaults;
      return axiosMock;
    });

    // Stub methods to return promises
    axiosMock.get.mockResolvedValue();
    axiosMock.post.mockResolvedValue();
    axiosMock.put.mockResolvedValue();
    axiosMock.delete.mockResolvedValue();

    requestConfig = new HttpRequestConfigBuilder().setParams({
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

  describe('GET', () => {
    test('should perform GET requests with the supplied params', () => {
      return httpClient.get('/api/resources', requestConfig).then(() => {
        expect(axiosMock.get).toHaveBeenCalledTimes(1);
        expect(axiosMock.get).toHaveBeenCalledWith('/api/resources', requestConfig.config);
      });
    });

    test('should add x-request-id header', () => {
      return httpClient.get('/api/resources', requestConfig).then(() => {
        expect(axiosMock.get.mock.calls[0][1].headers).toHaveProperty(X_REQUEST_ID_HEADER);
      });
    });

    test('should add default read timeout to request configuration', () => {
      return httpClient.get('/api/resources', requestConfig).then(() => {
        expect(axiosMock.get.mock.calls[0][1].timeout).toEqual(1000);
      });
    });

    test('should not add default read timeout to request configuration if already provided', () => {
      requestConfig.setTimeout(500);
      return httpClient.get('/api/resources', requestConfig).then(() => {
        expect(axiosMock.get.mock.calls[0][1].timeout).toEqual(500);
      });
    });

    test('should work without providing request config', () => {
      return httpClient.get('/api/resources').then(() => {
        expect(axiosMock.get).toHaveBeenCalledTimes(1);
        expect(axiosMock.get.mock.calls[0][1]).toHaveProperty('headers');
        expect(axiosMock.get.mock.calls[0][1].headers).toHaveProperty(X_REQUEST_ID_HEADER);
        expect(axiosMock.get.mock.calls[0][1]).toHaveProperty('timeout');
      });
    });
  });

  describe('POST', () => {
    test('should perform POST requests with the supplied params and data', () => {
      return httpClient.post('/api/resources', requestData, requestConfig).then(() => {
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axiosMock.post).toHaveBeenCalledWith('/api/resources', requestData, requestConfig.config);
      });
    });

    test('should add x-request-id header', () => {
      return httpClient.post('/api/resources', requestData, requestConfig).then(() => {
        expect(axiosMock.post.mock.calls[0][2].headers).toHaveProperty(X_REQUEST_ID_HEADER);
      });
    });

    test('should add default read timeout to request configuration', () => {
      return httpClient.post('/api/resources', requestData, requestConfig).then(() => {
        expect(axiosMock.post.mock.calls[0][2].timeout).toEqual(2000);
      });
    });

    test('should not add default read timeout to request configuration if already provided', () => {
      requestConfig.setTimeout(500);
      return httpClient.post('/api/resources', requestData, requestConfig).then(() => {
        expect(axiosMock.post.mock.calls[0][2].timeout).toEqual(500);
      });
    });

    test('should work without providing request config', () => {
      return httpClient.post('/api/resources', requestData).then(() => {
        expect(axiosMock.post).toHaveBeenCalledTimes(1);
        expect(axiosMock.post.mock.calls[0][2]).toHaveProperty('headers');
        expect(axiosMock.post.mock.calls[0][2].headers).toHaveProperty(X_REQUEST_ID_HEADER);
        expect(axiosMock.post.mock.calls[0][2]).toHaveProperty('timeout');
      });
    });
  });

  describe('PUT', () => {
    test('should perform PUT requests with the supplied params and data', () => {
      return httpClient.put('/api/resources/1/', requestData, requestConfig).then(() => {
        expect(axiosMock.put).toHaveBeenCalledTimes(1);
        expect(axiosMock.put).toHaveBeenCalledWith('/api/resources/1/', requestData, requestConfig.config);
      });
    });

    test('should add x-request-id header', () => {
      return httpClient.put('/api/resources', requestData, requestConfig).then(() => {
        expect(axiosMock.put.mock.calls[0][2].headers).toHaveProperty(X_REQUEST_ID_HEADER);
      });
    });

    test('should add default read timeout to request configuration', () => {
      return httpClient.put('/api/resources', requestData, requestConfig).then(() => {
        expect(axiosMock.put.mock.calls[0][2].timeout).toEqual(2000);
      });
    });

    test('should not add default read timeout to request configuration if already provided', () => {
      requestConfig.setTimeout(500);
      return httpClient.put('/api/resources', requestData, requestConfig).then(() => {
        expect(axiosMock.put.mock.calls[0][2].timeout).toEqual(500);
      });
    });

    test('should work without providing request config', () => {
      return httpClient.put('/api/resources', requestData).then(() => {
        expect(axiosMock.put).toHaveBeenCalledTimes(1);
        expect(axiosMock.put.mock.calls[0][2]).toHaveProperty('headers');
        expect(axiosMock.put.mock.calls[0][2].headers).toHaveProperty(X_REQUEST_ID_HEADER);
        expect(axiosMock.put.mock.calls[0][2]).toHaveProperty('timeout');
      });
    });
  });

  describe('DELETE', () => {
    test('should perform DELETE requests with the supplied params', () => {
      return httpClient.deleteResource('/api/resources/1/', requestConfig).then(() => {
        expect(axiosMock.delete).toHaveBeenCalledTimes(1);
        expect(axiosMock.delete).toHaveBeenCalledWith('/api/resources/1/', requestConfig.config);
      });
    });

    test('should add x-request-id header', () => {
      return httpClient.deleteResource('/api/resources', requestConfig).then(() => {
        expect(axiosMock.delete.mock.calls[0][1].headers).toHaveProperty(X_REQUEST_ID_HEADER);
      });
    });

    test('should add default read timeout to request configuration', () => {
      return httpClient.deleteResource('/api/resources', requestConfig).then(() => {
        expect(axiosMock.delete.mock.calls[0][1].timeout).toEqual(2000);
      });
    });

    test('should not add default read timeout to request configuration if already provided', () => {
      requestConfig.setTimeout(500);
      return httpClient.deleteResource('/api/resources', requestConfig).then(() => {
        expect(axiosMock.delete.mock.calls[0][1].timeout).toEqual(500);
      });
    });

    test('should work without providing request config', () => {
      return httpClient.deleteResource('/api/resources').then(() => {
        expect(axiosMock.delete).toHaveBeenCalledTimes(1);
        expect(axiosMock.delete.mock.calls[0][1]).toHaveProperty('headers');
        expect(axiosMock.delete.mock.calls[0][1].headers).toHaveProperty(X_REQUEST_ID_HEADER);
        expect(axiosMock.delete.mock.calls[0][1]).toHaveProperty('timeout');
      });
    });
  });
});
