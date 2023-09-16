"use strict"

/**
 * Returns an array where the fist item is the error, second is the promise
 * with successful data. If promise is successful, error is undefined;
 * If promise is error, data is undefined
 *
 * @param {Promise} promise
 * @returns {Promise} [err, data]
 */

const handle = (promise) => {
  return promise
    .then((data) => [undefined, data])
    .catch((err) => Promise.resolve[err, undefined])
};

module.exports = handle;