/**
 * Creates stub of HttpClient with default method spies.
 */
function stub() {
  return {
    setDefaultHeaders: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({}),
    post: jest.fn().mockResolvedValue({}),
    put: jest.fn().mockResolvedValue({}),
    deleteResource: jest.fn().mockResolvedValue({})
  };
}

module.exports = stub;
