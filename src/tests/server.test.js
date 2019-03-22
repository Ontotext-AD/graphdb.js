// import axios from 'axios';
import Server from '../classes/server';

jest.mock('axios');

test('New server instance should not return null', (done) => {
  expect(new Server(null)).not.toBeNull();
  done();
});
