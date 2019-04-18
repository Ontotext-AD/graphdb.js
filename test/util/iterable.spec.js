const Iterable = require('util/iterable');

/*
 * Tests the iterable utility and how it behaves with different sets of collections.
 */
describe('Iterable utility', () => {

  test('should handle empty collections', () => {
    const emptyCollection = [];
    const iterable = new Iterable(emptyCollection);

    expect(iterable.hasNext()).toBeFalsy();
    expect(() => iterable.next()).toThrowError();
  });

  test('should handle collections with single item', () => {
    // Collection with single item
    const collection = ['1'];
    const iterable = new Iterable(collection);

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('1');

    expect(iterable.hasNext()).toBeFalsy();
    expect(() => iterable.next()).toThrowError();
  });

  test('should handle collections with multiple items', () => {
    const collection = ['1', '2', '3'];
    const iterable = new Iterable(collection);

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('1');

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('2');

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('3');

    expect(iterable.hasNext()).toBeFalsy();
    expect(() => iterable.next()).toThrowError();
  });

  test('should reset the current iteration', () => {
    const collection = ['1', '2', '3'];
    const iterable = new Iterable(collection);

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('1');

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('2');

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('3');

    iterable.reset();

    expect(iterable.hasNext()).toBeTruthy();
    expect(iterable.next()).toEqual('1');
  });

});
