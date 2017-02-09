/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off */


const assert = require('assert');
const compose = require('..');

describe('error handle', function () {
  it('should throw on not-function middleware', function () {
    assert.throws(() => compose(2), 'middleware should be a function');
    assert.throws(() => compose(['']), 'middleware should be a function');
    assert.throws(() => compose([false]), 'middleware should be a function');
    assert.throws(() => compose([new Date()]), 'middleware should be a function');
  });
  it('should reject when return as promise', function () {
    return compose([async () => throwError()])().then(cantReachHere, catchError)
    .then(() => compose([() => rejectError()])().then(cantReachHere, catchError));
  });

  it('should reject when throw in middleware', function () {
    return compose(() => throwError())().then(cantReachHere, catchError);
  });

  it('should catch the error in downstream middleware', function () {
    const result = [],
      stack = [];
    stack.push(async function (req, resp, next) {
      result.push(1);
      await sleep(1);
      try {
        result.push(2);
        await next();
        result.push(3);
      } catch (e) {
        result.push(4);
      }
      await sleep(1);
      result.push(5);
    });
    stack.push(async function (req, resp, next) {
      result.push(6);
      await sleep(1);
      if (result) throw new Error();
      result.push(7);
    });
    return compose(stack)().then(() => assert.deepStrictEqual(result, [1, 2, 6, 4, 5]));
  });
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function rejectError() {
  return Promise.reject(new Error('the thrown test error'));
}

function throwError() {
  throw new Error('the thrown test error');
}

function catchError(err) {
  assert.equal(err.message, 'the thrown test error');
}

function cantReachHere() {
  throw new Error('cant reach here');
}
