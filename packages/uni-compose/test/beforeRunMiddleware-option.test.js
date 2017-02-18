
const assert = require('assert');
const compose = require('..');

describe('uni-compose:beforeRunMiddleware option', function () {
  it('should work with a sync function', function () {
    const stack = [],
      result = [];
    const a = async function (req, resp, next) {
      result.push(1);
      await next();
    };
    stack.push(a);
    const b = function (req, resp, next) {
      result.push(2);
      return next();
    };
    stack.push(b);
    stack.push(async function c(req, resp, next) {
      result.push(3);
      await next();
    });

    return compose(stack, { beforeRunMiddleware: (fn, req, resp) => fn !== b })()
      .then(() => assert.deepEqual(result, [1, 3]));
  });

  it('should work with a promise-return and async function', function () {
    const stack = [],
      result = [];
    const a = async function (req, resp, next) {
      result.push(1);
      await next();
    };
    stack.push(a);
    const b = function (req, resp, next) {
      result.push(2);
      return next();
    };
    stack.push(b);
    stack.push(async function c(req, resp, next) {
      result.push(3);
      await next();
    });

    return compose(stack, { beforeRunMiddleware: (fn, req, resp) => sleep(10).then(() => fn !== b) })()
      .then(() => assert.deepEqual(result, [1, 3]));
  });
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
