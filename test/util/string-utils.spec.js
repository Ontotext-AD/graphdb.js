const StringUtils = require('util/string-utils');

describe('StringUtils', () => {
  describe('isBlank()', () => {
    test('should correctly determine if the provided value is blank or not', () => {
      expect(StringUtils.isBlank()).toEqual(true);
      expect(StringUtils.isBlank(null)).toEqual(true);
      expect(StringUtils.isBlank(undefined)).toEqual(true);
      expect(StringUtils.isBlank('')).toEqual(true);
      expect(StringUtils.isBlank('  ')).toEqual(true);
      expect(StringUtils.isBlank(' a ')).toEqual(false);
      expect(StringUtils.isBlank('a')).toEqual(false);
    });
  });

  describe('isNotBlank()', () => {
    test('should correctly determine if the provided value is not blank or otherwise', () => {
      expect(StringUtils.isNotBlank()).toEqual(false);
      expect(StringUtils.isNotBlank(null)).toEqual(false);
      expect(StringUtils.isNotBlank(undefined)).toEqual(false);
      expect(StringUtils.isNotBlank('')).toEqual(false);
      expect(StringUtils.isNotBlank('  ')).toEqual(false);
      expect(StringUtils.isNotBlank(' a ')).toEqual(true);
      expect(StringUtils.isNotBlank('a')).toEqual(true);
    });
  });
});
