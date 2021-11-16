const fs = require('fs');

exports.assert = assert;

/**
 * Objects parsed from user data could have extra spaces.
 *
 * @param {Record<string,any>} obj
 */
exports.trimmedObject = function trimmedObject(obj) {
  return Object.keys(obj).reduce((acc, key) => {
    acc[key] = typeof obj[key] == 'string' ? obj[key].trim() : obj[key];
    return acc;
  }, {});
};

/**
 * @template {any} T
 * @param {Array<T>} arr
 * @returns {Array<T>}
 */
exports.unique = function unique(arr) {
  return [...new Set(arr)];
};

exports.submissionLabel = 'resource :recycle:';

exports.readJSON = function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

exports.writeJSON = function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

/**
 * @param {any} condition
 * @param {string} message
 * @returns {asserts condition}
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}
