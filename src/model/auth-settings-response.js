/**
 * Response model for the free access settings endpoint.
 * Contains the enabled flag, authorities and application settings.
 *
 * @class
 */
class AuthSettingsResponse {
  /**
   * @param {Object} data Settings data from the server
   * @param {boolean} [data.enabled] Whether security/feature is enabled
   * @param {string[]} [data.authorities] Array of authorities
   * @param {Object} [data.appSettings] Application settings
   */
  constructor(data = {}) {
    this.enabled = data.enabled;
    this.authorities = data.authorities || [];
    this.appSettings = data.appSettings;
  }

  /**
   * Check if security/feature is enabled
   * @return {boolean} true if enabled, false otherwise
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get authorities
   * @return {string[]} array of authorities
   */
  getAuthorities() {
    return this.authorities;
  }

  /**
   * Get application settings
   * @return {Object} application settings
   */
  getAppSettings() {
    return this.appSettings;
  }
}

module.exports = AuthSettingsResponse;
