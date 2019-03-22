/**
 * Interface for server configuration
 * @interface ServerConfig
 * @param { String } url
 * @param { Object } defaultRepositoryConfig
 */
export const ServerConfig = (url, defaultRepositoryConfig) => ({
  url,
  defaultRepositoryConfig,
});
