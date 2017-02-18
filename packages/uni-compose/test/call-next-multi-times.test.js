
const assert = require('assert');
const compose = require('..');

describe('uni-compose:call next() multiple times', function () {
  it('should not throw in 1 middleware without ending next', function () {
    return compose([async (req, resp, next) => {
      await next();
      await next();
    }])();
  });

  describe('in 1 middleware with sync ending next', function () {
    it('should throw when call in order', function () {
      return compose([async (req, resp, next) => {
        await next().then(result => assert.equal(result, 1)).catch(cantReachHere);
        await next();
      }])(null, null, () => 1).then(cantReachHere, catchError);
    });

    it('should throw when call concurrently and wait last one', function () {
      return compose([async (req, resp, next) => {
        next();
        await next();
      }])(null, null, () => 1).then(cantReachHere, catchError);
    });

    it('should not throw when call concurrently and no wait', function () {
      const result = [];
      let err;
      return compose([(req, resp, next) => {
        next();
        next().catch(e => (err = e));
        return sleep(10);
      }])(null, null, () => result.push(1))
      .then(() => assert.deepEqual(result, [1]) && catchError(err));
    });
  });

  describe('in 1 middleware with async ending next', function () {
    it('should throw when call in order', function () {
      return compose([async (req, resp, next) => {
        await next().then(result => assert.equal(result, 1)).catch(cantReachHere);
        await next();
      }])(null, null, () => sleep(1).then(() => 1)).then(cantReachHere, catchError);
    });

    it('should throw when call concurrently and wait last one', function () {
      return compose([async (req, resp, next) => {
        next();
        await next();
      }])(null, null, () => sleep(1)).then(cantReachHere, catchError);
    });

    it('should not throw when call concurrently and no wait', function () {
      const result = [];
      let err;
      return compose([async (req, resp, next) => {
        next();
        next().catch(e => (err = e));
        return sleep(10);
      }])(null, null, () => sleep(10).then(() => result.push(1)))
      .then(() => assert.deepEqual(result, [1]) && catchError(err));
    });
  });

  describe('in multiple middlewares', function () {
    it('should throw', function () {
      const stack = [],
        result = [];
      stack.push(async (req, resp, next) => {
        next();
        await next();
      });
      stack.push((req, resp, next) => {
        result.push(1);
      });
      return compose(stack)().then(() => {
        throw new Error('cant reach here');
      }, err => assert.deepEqual(result, [1]) && assert.equal(err.message, 'next() called multiple times'));
    });

    it('should throw in plain function', function () {
      const stack = [],
        result = [];
      stack.push((req, resp, next) => {
        next();
        return next();
      });
      stack.push((req, resp, next) => {
        result.push(1);
      });
      return compose(stack)().then(cantReachHere, err => assert.deepEqual(result, [1]) && catchError(err));
    });
  });
});

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function catchError(err) {
  assert.equal(err.message, 'next() called multiple times');
}

function cantReachHere() {
  throw new Error('cant reach here');
}
