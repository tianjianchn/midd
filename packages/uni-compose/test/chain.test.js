
const assert = require('assert');
const compose = require('..');

describe('uni-compose:chain', function () {
  describe('0 middleware', function () {
    it('should work with next', function () {
      const stack = [];
      return compose(stack)(null, null, () => 1)
      .then(result => assert.equal(result, 1));
    });

    it('should work without next', function () {
      const stack = [];
      return compose(stack)()
      .then(result => assert.strictEqual(result, undefined));
    });
  });

  describe('1 middleware', function () {
    it('should work', function () {
      const stack = [];
      stack.push(async (req, resp, next) => 1);
      return compose(stack)()
        .then(result => assert.strictEqual(result, 1));
    });

    it('should work with call ending next', function () {
      const stack = [],
        result = [];
      stack.push(async (req, resp, next) => {
        result.push(1);
        await next();
      });
      return compose(stack)(null, null, () => result.push(0))
        .then(() => assert.deepStrictEqual(result, [1, 0]));
    });
  });
  describe('2 middlewares', function () {
    it('should work', function () {
      const stack = [],
        result = [];
      stack.push(async (req, resp, next) => {
        result.push(1);
        await sleep(1);
        await next();
        await sleep(1);
        result.push(2);
      });
      stack.push(async (req, resp, next) => {
        await sleep(1);
        result.push(3);
        await sleep(1);
      });
      return compose(stack)()
        .then(() => assert.deepStrictEqual(result, [1, 3, 2]));
    });

    it('should work without call next', function () {
      const stack = [],
        result = [];
      stack.push(async (req, resp, next) => {
        result.push(1);
      });
      stack.push(async (req, resp, next) => {
        result.push(2);
      });
      return compose(stack)()
        .then(() => assert.deepStrictEqual(result, [1]));
    });
  });

  describe('3+ middlewares', function () {
    it('should work', function () {
      const stack = [],
        result = [];
      stack.push(async (req, resp, next) => {
        result.push(1);
        await next();
        result.push(2);
      });
      stack.push(async (req, resp, next) => {
        result.push(3);
        await sleep(1);
        await next();
        await sleep(1);
        result.push(4);
      });
      stack.push(async (req, resp, next) => {
        result.push(5);
        await next();
        result.push(6);
      });
      stack.push(async (req, resp, next) => {
        result.push(7);
      });
      return compose(stack)()
        .then(() => assert.deepStrictEqual(result, [1, 3, 5, 7, 6, 4, 2]));
    });

    it('should work without call next', function () {
      const stack = [],
        result = [];
      stack.push(async (req, resp, next) => {
        result.push(1);
        await next();
        result.push(2);
      });
      stack.push(async (req, resp, next) => {
        result.push(3);
        await next();
        result.push(4);
      });
      stack.push(async (req, resp, next) => {
        result.push(5);
        result.push(6);
      });
      stack.push(async (req, resp, next) => {
        result.push(7);
      });
      return compose(stack)()
        .then(() => assert.deepStrictEqual(result, [1, 3, 5, 6, 4, 2]));
    });

    it('should work with sync middlewares and without wait next call', function () {
      const stack = [],
        result = [];
      stack.push((req, resp, next) => {
        result.push(1);
        next();
        result.push(2);
      });
      stack.push((req, resp, next) => {
        result.push(3);
        next();
        result.push(4);
      });
      stack.push((req, resp, next) => {
        result.push(5);
        next();
        result.push(6);
      });
      return compose(stack)().then(() => assert.deepStrictEqual(result, [1, 3, 5, 6, 4, 2]));
    });

    it('should work with nested-composed middlewares', function () {
      const innerStack = [],
        outerStack = [],
        result = [];
      innerStack.push(async function (req, resp, next) {
        result.push(5);
        await next();
        result.push(6);
      });
      innerStack.push(async (req, resp, next) => {
        result.push(7);
        await next();
        result.push(8);
      });
      outerStack.push(async function (req, resp, next) {
        result.push(1);
        await next();
        result.push(2);
      });
      outerStack.push(async (req, resp, next) => {
        result.push(3);
        await next();
        result.push(4);
      });
      outerStack.push(compose(innerStack));
      return compose(outerStack)().then(() => assert.deepEqual(result, [1, 3, 5, 7, 8, 6, 4, 2]));
    });

    it('should work with promise-only', function () {
      const stack = [],
        result = [];
      stack.push((req, resp, next) => {
        result.push(1);
        return sleep(1).then(next).then(() => sleep(1)).then(() => result.push(2));
      });
      stack.push((req, resp, next) => {
        result.push(3);
        return sleep(1).then(next).then(() => sleep(1)).then(() => result.push(4));
      });
      stack.push((req, resp, next) => {
        result.push(5);
        return sleep(1).then(next).then(() => sleep(1)).then(() => result.push(6));
      });
      return compose(stack)().then(() => assert.deepStrictEqual(result, [1, 3, 5, 6, 4, 2]));
    });
  });
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
