const Service = require('service/service');

/*
 * Testing corner cases in the base Service class.
 */
describe('Service', () => {
  it('should require to implement getServiceName()', () => {
    expect(() => new Service(() => {})).toThrow(Error('Must be overridden!'));
    expect(() => new InvalidService(() => {})).toThrow(Error('Must be overridden!'));
  });
});

class InvalidService extends Service {
  // Not implementing abstract methods.
}
