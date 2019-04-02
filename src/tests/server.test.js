//import mockAxios from 'axios';
import Server from '../classes/server';
import {ServerConfig} from '../configs/server-config';

jest.mock('axios')

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
});

/**
 * Test implementation for the {@link ServerConfig}
 */
class TestServerConfig extends ServerConfig {
}

