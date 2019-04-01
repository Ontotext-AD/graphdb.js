import mockAxios from 'axios';
import Server from '../classes/server';
import {ServerConfig} from '../configs/server-config';

jest.mock('axios', ()=> {
  require('./axios-mock');
});

describe('Server', () => {
  test('new Server instance should not return null', () => {
    expect(new Server(null)).not.toBeNull();
  });

  test('should init server with required class member fields', () => {
    const config = new TestServerConfig('server/url', {});
    const server = new Server(config);
    expect(server.config).toEqual({
      url: 'server/url',
      defaultRepositoryConfig: {},
    });
  });

  test('New server instance should not return null', (done) => {
    expect(new Server(null, {})).not.toBeNull();
    done();
  });

  test('Call axios with endpoint and method at getRepositoryIDs', (done) => {
    mockAxios.get.mockImplementationOnce(() =>{
      Promise.resolve({
        data: {},
      });
    });
    expect(mockAxios.get).toHaveBeenCalledTimes(1);
    expect(mockAxios.get).toHaveBennCalledWith('http://ff-dev.ontotext.com/repositories');
    done();
  });
});




/**
 * Test implementation for the {@link ServerConfig}
 */
class TestServerConfig extends ServerConfig {
}
