const graphdb = require('index');
const Authority = require('security/authority');

describe('Package entry point', () => {
  it('should export Authority as security.Authority', () => {
    expect(graphdb.security.Authority).toBe(Authority);
  });
});
