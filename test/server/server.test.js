import axios from 'axios';
import Server from '../../src/server/server';
import {ServerConfig} from '../../src/server/server-config';

jest.mock('axios');

describe('Server', () => {
  describe('initialization', () => {
    test('new Server instance should not return null', () => {
      expect(new Server(null, null)).not.toBeNull();
    });

    test('should set required class member fields', () => {
      const config = new TestServerConfig('server/url', {});
      const server = new Server(config);
      expect(server.config).toEqual({
        url: 'server/url',
        defaultRepositoryConfig: {},
      });
    });
  });

  describe('getRepositoryIDs', () => {
    test('should make request with required parameters', () => {
      axios.get.mockImplementation(() => Promise.resolve({
        data: {
          results: {
            bindings: [],
          },
        },
      }));

      const config = new TestServerConfig('server/url', {});
      const server = new Server(config);
      server.axios = axios;

      return server.getRepositoryIDs().then(() => {
        expect(server.axios.get).toHaveBeenCalledTimes(1);
        expect(server.axios.get).toHaveBeenCalledWith('repositories');
      });
    });

    test('should resolve with proper result', () => {
      //
    });

    test('should reject with error', () => {
      //
    });
  });
});

/**
 * Test implementation for the {@link ServerConfig}
 */
class TestServerConfig extends ServerConfig {
}
