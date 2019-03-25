const mockAxios = {
  get: jest.fn(()=>{
    Promise.resolve({data: {}});
  }),
};

export default mockAxios;
