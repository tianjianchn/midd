
const assert = require('assert');
const compose = require('..');

describe('uni-compose:basic', function () {
  it('should keep `this` context in middlewares', function () {
    const ctx = {},
      stack = [];
    stack.push(async function (req, resp, next) {
      await next();
      assert.equal(this, ctx);
    });
    stack.push(function (req, resp, next) {
      assert.equal(this, ctx);
      return next();
    });
    stack.push(async function (req, resp, next) {
      await next();
      assert.equal(this, ctx);
    });
    stack.push(async (req, resp, next) => {
      await next();
      assert.notEqual(this, ctx);
    });
    return compose(stack).call(ctx).then(() => 0);
  });
});
