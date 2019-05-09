const HttpClientConfig = require('http/http-client-config');

describe('HttpClientConfig', () => {
  test('should init with an empty config', () => {
    expect(new HttpClientConfig().get()).toEqual({});
  });

  test('should add a header in headers map', () => {
    expect(new HttpClientConfig()
      .addHeader('Accept', 'text/turtle')
      .get())
      .toEqual({
        headers: {'Accept': 'text/turtle'}
      });
  });

  test('should set params provided as argument in the config', () => {
    expect(new HttpClientConfig()
      .setParams({
        subj: 'subj',
        pred: 'pred'
      })
      .get())
      .toEqual({
        params: {
          subj: 'subj',
          pred: 'pred'
        }
      });
  });

  test('should add param in the params mapping', () => {
    expect(new HttpClientConfig()
      .addParam('subj', 'subj')
      .get())
      .toEqual({
        params: {
          subj: 'subj'
        }
      });
  });

  test('should should set timeout configuration', () => {
    expect(new HttpClientConfig()
      .setTimeout(1000)
      .get())
      .toEqual({
        timeout: 1000
      });
  });

  test('should should set response type configuration', () => {
    expect(new HttpClientConfig()
      .setResponseType('stream')
      .get())
      .toEqual({
        responseType: 'stream'
      });
  });

  test('should add Accept header', () => {
    expect(new HttpClientConfig()
      .addAcceptHeader('text/turtle')
      .get())
      .toEqual({
        headers: {'Accept': 'text/turtle'}
      });
  });

  test('should add Content-Type header', () => {
    expect(new HttpClientConfig()
      .addContentTypeHeader('text/turtle')
      .get())
      .toEqual({
        headers: {'Content-Type': 'text/turtle'}
      });
  });
});
