/**
 * Creates stub of HttpClient with default method spies.
 */
function stub(baseUrl) {
  const instance = {
    baseUrl,
    setDefaultHeaders: jest.fn().mockImplementation(() => instance),
    setDefaultReadTimeout: jest.fn().mockImplementation(() => instance),
    setDefaultWriteTimeout: jest.fn().mockImplementation(() => instance),
    request: jest.fn().mockResolvedValue({}),
    getBaseURL: () => baseUrl
  };
  return instance;
}

module.exports = stub;
