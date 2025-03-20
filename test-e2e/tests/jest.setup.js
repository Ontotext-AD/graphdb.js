const { GenericContainer, Wait } = require('testcontainers');
const config = require('./config');
global.XMLHttpRequest = undefined;

// Default timeout for tests
jest.setTimeout(60000);

const image = `docker-registry.ontotext.com/graphdb:10.8.4`;
let graphDBContainer;
let graphDBUrl;
const HOST_PORT = 7200; // Fixed host port
const CONTAINER_PORT = 7200; // GraphDB internal port

global.beforeAll(async () => {
  try {
    graphDBContainer = await new GenericContainer(image)
      .withExposedPorts([{
        container: CONTAINER_PORT,
        host: HOST_PORT
      }])
      .withWaitStrategy(Wait.forLogMessage('Started GraphDB in workbench mode at port 7200'))
      .start();

    const mappedPort = graphDBContainer.getMappedPort(7200);
    graphDBUrl = `http://${graphDBContainer.getHost()}:${mappedPort}`;

    // config.updateServerAddress(graphDBUrl);

    console.log(`GraphDB started at: ${graphDBUrl}`);
  } catch (error) {
    console.error('Failed to start GraphDB container:', error);
    throw error;
  }
});

global.afterAll(async () => {
  if (graphDBContainer) {
    await graphDBContainer.stop();
  }
});
