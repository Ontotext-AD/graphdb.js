const CommonUtils = require('util/common-utils');

describe('CommonUtils', () => {
  test('hasNullArguments()', () => {
    expect(CommonUtils.hasNullArguments()).toEqual(false);
    expect(CommonUtils.hasNullArguments(null)).toEqual(true);
    expect(CommonUtils.hasNullArguments('')).toEqual(true);
    expect(CommonUtils.hasNullArguments('', null)).toEqual(true);
    expect(CommonUtils.hasNullArguments('abc', null)).toEqual(true);
    expect(CommonUtils.hasNullArguments(null, '')).toEqual(true);
    expect(CommonUtils.hasNullArguments(null, 'abc')).toEqual(true);
    expect(CommonUtils.hasNullArguments('abc')).toEqual(false);
  });
});
