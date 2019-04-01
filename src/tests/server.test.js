import mockAxios from 'axios';
import Server from '../classes/server';

jest.mock('axios', ()=> {
  require('./axios-mock');
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

