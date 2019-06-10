/**
 * Creates stub of HttpClient with default method spies.
 */
function stub(baseUrl) {
  return {
    baseUrl,
    setDefaultHeaders: jest.fn().mockReturnThis(),
    setDefaultReadTimeout: jest.fn().mockReturnThis(),
    setDefaultWriteTimeout: jest.fn().mockReturnThis(),
    request: jest.fn().mockResolvedValue({}),
    getBaseURL: () => baseUrl
  };
}

module.exports = stub;
