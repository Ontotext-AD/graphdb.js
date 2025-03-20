const ObjectUtils = require('util/object-utils');

describe('ObjectUtils', () => {

    test('isNull should return true when the value is null', () => {
        expect(ObjectUtils.isNull(null)).toBeTruthy();
    });

    test('isNull should return false when the value is not null', () => {
        expect(ObjectUtils.isNull(undefined)).toBeFalsy();
        expect(ObjectUtils.isNull("value")).toBeFalsy();
    });

    test('isUndefined should return true when the value is undefined', () => {
        expect(ObjectUtils.isUndefined(undefined)).toBeTruthy();
    });

    test('isUndefined should return false when the value is not undefined', () => {
        expect(ObjectUtils.isUndefined(null)).toBeFalsy();
        expect(ObjectUtils.isUndefined("value")).toBeFalsy();
    });

    test('isNullOrUndefined should return true when the value is undefined or null', () => {
        expect(ObjectUtils.isNullOrUndefined(undefined)).toBeTruthy();
        expect(ObjectUtils.isNullOrUndefined(null)).toBeTruthy();
    });

    test('isNullOrUndefined should return false when the value is neither undefined nor null', () => {
        expect(ObjectUtils.isNullOrUndefined("value")).toBeFalsy();
    });
});
