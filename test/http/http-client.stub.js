/**
 * Creates stub of HttpClient with default method spies.
 */
function stub(baseUrl) {
  return {
    baseUrl,
    setDefaultHeaders: jest.fn().mockReturnThis(),
    setDefaultReadTimeout: jest.fn().mockReturnThis(),
    setDefaultWriteTimeout: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    deleteResource: jest.fn().mockResolvedValue({})
  };
}

module.exports = stub;
