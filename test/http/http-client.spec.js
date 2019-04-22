const axios = require('axios');
const HttpClient = require('http/http-client');

jest.mock('axios');

/*
 * Tests the wrapping of axios in HttpClient and how it delegates requests.
 */
describe('HttpClient', () => {

  let axiosMock;
  let httpClient;

  let requestConfig = {
    params: {
      'param-1': 'value-1'
    }
  };

  let requestData = {
    'property': 'payload'
  };

  beforeEach(() => {
    axios.mockReset();

    // Stub axios.create to return a mock of axios
    axiosMock = jest.genMockFromModule('axios');
    axios.create.mockReturnValue(axiosMock);

    // Stub methods to return promises
    axiosMock.get.mockResolvedValue();
    axiosMock.post.mockResolvedValue();
    axiosMock.put.mockResolvedValue();
    axiosMock.delete.mockResolvedValue();
    axiosMock.defaults = {};

    httpClient = new HttpClient('/base/url', 1000);
  });

  test('should initialize the client with the supplied options', () => {
    expect(httpClient).not.toBeNull();
    expect(httpClient.axios).not.toBeNull();
    expect(axios.create).toHaveBeenCalledTimes(1);
    expect(axios.create).toHaveBeenCalledWith({baseURL: '/base/url', timeout: 1000});
  });

  test('should allow to set default request headers', () => {
    let headers = {'Accept': 'application/json'};
    httpClient.setDefaultHeaders(headers);
    expect(axiosMock.defaults.headers).toEqual(headers);
  });

  test('should perform GET requests with the supplied params', () => {
    return httpClient.get('/api/resources', requestConfig).then(() => {
      expect(axiosMock.get).toHaveBeenCalledTimes(1);
      expect(axiosMock.get).toHaveBeenCalledWith('/api/resources', requestConfig);
    });
  });

  test('should perform POST requests with the supplied params and data', () => {
    return httpClient.post('/api/resources', requestData, requestConfig).then(() => {
      expect(axiosMock.post).toHaveBeenCalledTimes(1);
      expect(axiosMock.post).toHaveBeenCalledWith('/api/resources', requestData, requestConfig);
    });
  });

  test('should perform PUT requests with the supplied params and data', () => {
    return httpClient.put('/api/resources/1/', requestData, requestConfig).then(() => {
      expect(axiosMock.put).toHaveBeenCalledTimes(1);
      expect(axiosMock.put).toHaveBeenCalledWith('/api/resources/1/', requestData, requestConfig);
    });
  });

  test('should perform DELETE requests with the supplied params', () => {
    return httpClient.deleteResource('/api/resources/1/', requestConfig).then(() => {
      expect(axiosMock.delete).toHaveBeenCalledTimes(1);
      expect(axiosMock.delete).toHaveBeenCalledWith('/api/resources/1/', requestConfig);
    });
  });

});
