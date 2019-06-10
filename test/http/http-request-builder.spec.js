const HttpRequestBuilder = require('http/http-request-builder');

describe('HttpRequestBuilder', () => {
  test('should init with an empty config', () => {
    expect(new HttpRequestBuilder().get()).toEqual({});
  });

  test('should assign request with HTTP method and URL', () => {
    let builder = new HttpRequestBuilder();
    expect(builder.getMethod()).toBeUndefined();
    expect(builder.getUrl()).toBeUndefined();

    builder = HttpRequestBuilder.httpGet('/get');
    expect(builder.getMethod()).toEqual('get');
    expect(builder.getUrl()).toEqual('/get');

    builder = HttpRequestBuilder.httpPost('/post');
    expect(builder.getMethod()).toEqual('post');
    expect(builder.getUrl()).toEqual('/post');

    builder = HttpRequestBuilder.httpPut('/put');
    expect(builder.getMethod()).toEqual('put');
    expect(builder.getUrl()).toEqual('/put');

    builder = HttpRequestBuilder.httpDelete('/delete');
    expect(builder.getMethod()).toEqual('delete');
    expect(builder.getUrl()).toEqual('/delete');
  });

  test('should add a header in headers map', () => {
    expect(new HttpRequestBuilder()
      .addHeader('Accept', 'text/turtle')
      .get())
      .toEqual({
        headers: {'Accept': 'text/turtle'}
      });
  });

  test('should set params provided as argument in the config', () => {
    expect(new HttpRequestBuilder()
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
    expect(new HttpRequestBuilder()
      .addParam('subj', 'subj')
      .addParam('pred', 'pred')
      .get())
      .toEqual({
        params: {
          subj: 'subj',
          pred: 'pred'
        }
      });
  });

  test('should get the params mapping', () => {
    expect(new HttpRequestBuilder()
      .addParam('subj', 'subj')
      .addParam('pred', 'pred')
      .getParams())
      .toEqual({
        subj: 'subj',
        pred: 'pred'
      });
  });

  test('should should set timeout configuration', () => {
    expect(new HttpRequestBuilder()
      .setTimeout(1000)
      .get())
      .toEqual({
        timeout: 1000
      });
  });

  test('should get the timeout configuration', () => {
    expect(new HttpRequestBuilder()
      .setTimeout(1000)
      .getTimeout())
      .toEqual(1000);
  });

  test('should should set response type configuration', () => {
    expect(new HttpRequestBuilder()
      .setResponseType('stream')
      .get())
      .toEqual({
        responseType: 'stream'
      });
  });

  test('should get the response type configuration', () => {
    expect(new HttpRequestBuilder()
      .setResponseType('stream')
      .getResponseType())
      .toEqual('stream');
  });

  test('should add Accept header', () => {
    expect(new HttpRequestBuilder()
      .addAcceptHeader('text/turtle')
      .get())
      .toEqual({
        headers: {'Accept': 'text/turtle'}
      });
  });

  test('should add Content-Type header', () => {
    expect(new HttpRequestBuilder()
      .addContentTypeHeader('text/turtle')
      .get())
      .toEqual({
        headers: {'Content-Type': 'text/turtle'}
      });
  });

  test('should skip empty header values', () => {
    expect(new HttpRequestBuilder()
      .addContentTypeHeader('')
      .addAcceptHeader()
      .addHeader('custom', null)
      .get())
      .toEqual({});
  });

  test('should get the headers', () => {
    expect(new HttpRequestBuilder()
      .addContentTypeHeader('text/turtle')
      .getHeaders())
      .toEqual({
        'Content-Type': 'text/turtle'
      });
  });

  test('should set HTTP method', () => {
    expect(new HttpRequestBuilder()
      .setMethod('get')
      .get())
      .toEqual({
        method: 'get'
      });
  });

  test('should set request URL', () => {
    expect(new HttpRequestBuilder()
      .setUrl('/service')
      .get())
      .toEqual({
        url: '/service'
      });
  });

  test('should set data payload', () => {
    expect(new HttpRequestBuilder()
      .setData('some text data')
      .get())
      .toEqual({
        data: 'some text data'
      });
  });
});
