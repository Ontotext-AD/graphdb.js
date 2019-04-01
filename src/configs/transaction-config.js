/**
 * Interface for repository configuration
 * @interface TransactionConfig
 * @param { number } readTimeout
 * @param { number } writeTimeout
 * @param { Object } headers
 * @param { string } url
 */
export const TransactionConfig = (
    readTimeout, writeTimeout, headers, url
) => ({
  readTimeout,
  writeTimeout,
  headers,
  url,
});
