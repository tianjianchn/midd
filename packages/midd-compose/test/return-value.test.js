/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off */


const assert = require('assert');
const compose = require('..');

describe('return value', function () {
  it('should work with 0 middleware', function () {
    return compose([])(null, null, () => 1).then(result => assert.equal(result, 1))
    .then(() => compose([])(null, null, () => sleep().then(() => 1)).then(result => assert.equal(result, 1)));
  });

  it('should work with 1 middleware', function () {
    return Promise.all([
      compose([() => 1])(),
      compose([() => 1])(null, null, () => 1),
      compose([(req, resp, next) => next().then(result => result + 1)])(null, null, () => 1),
      compose([async (req, resp, next) => await next() + 1])(null, null, () => 1),
      compose([async (req, resp, next) => await next() + 1])(null, null, () => sleep(1).then(() => 1)),
    ]).then(result => assert.deepStrictEqual(result, [1, 1, 2, 2, 2]));
  });
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
