import axios from 'axios';
// TODO: base path should be configured somewhere in webpack!
import ServerClient from '../../src/server/server-client';
import {ServerClientConfig} from '../../src/server/server-client-config';

jest.mock('axios');

describe('ServerClient', () => {
  describe('initialization', () => {
    test('new ServerClient instance should not return null', () => {
      expect(new ServerClient(null, null)).not.toBeNull();
    });

    test('should set required class member fields', () => {
      const config = new TestServerConfig('server/url', {});
      const server = new ServerClient(config);
      expect(server.config).toEqual({
        url: 'server/url',
        headers: {},
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
      const server = new ServerClient(config);
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
 * Test implementation for the {@link ServerClientConfig}
 */
class TestServerConfig extends ServerClientConfig {
}
