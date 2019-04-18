/**
 * Utility class allowing to iterate a collection.
 *
 * Note: This should be used with immutable collections, e.g no add or remove
 * operations should be performed while iterating.
 *
 * @class
 * @author Mihail Radkov
 */
class Iterable {
  /**
   * Constructs new iterable for the provided collection.
   *
   * @param {Object[]} iterable the collection to iterate
   */
  constructor(iterable) {
    this.iterable = iterable;
    this.index = 0;
    this.size = iterable.length;
  }

  /**
   * Returns if there are elements left to be iterated from the collection.
   *
   * Use this method before calling {@link next()} to avoid out of bounds error.
   *
   * @return {boolean} <code>true</code> if there is at least single element
   *                    left to iterate or <code>false</code> otherwise
   */
  hasNext() {
    return this.index < this.size;
  }

  /**
   * Returns the next object from the iterable collection.
   *
   * Before invoking this method, check if there are elements to iterate by
   * using {@link hasNext()} because if there are no objects left to iterate,
   * the function will blow with an error.
   *
   * @return {Object} the next iterated object from the collection
   */
  next() {
    if (!this.hasNext()) {
      throw new Error('There are no elements left to iterate!');
    }
    return this.iterable[this.index++];
  }

  /**
   * Resets the iterable to begin from the start as if it was just constructed.
   *
   * @return {Iterable} the current iterable for method chaining.
   */
  reset() {
    this.index = 0;
    return this;
  }
}

module.exports = Iterable;
