/* eslint-env mocha*/
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */


const assert = require('assert');
// const url = require('url');
const compose = require('midd-compose');
const { sleep } = require('./helper');
const Router = require('..');

describe('router', function () {
  it('should keep this context in nested router', async function () {
    const routerA = Router(),
      routerB = Router();

    const obj = {},
      result = [];
    routerA.use(function (req, resp, next) {
      result.push(this);
      return next();
    });
    routerB.use('/a', function (req, resp, next) {
      result.push(this);
      return next();
    });
    routerA.use(routerB);

    await routerA.call(obj, { method: 'GET', url: '/a/b' });

    // Simulate router attach to app(app.use(router))
    await compose(routerA).call(obj, { method: 'GET', url: '/a/b' });

    assert.strictEqual(result[0], obj);
    assert.strictEqual(result[1], obj);
    assert.strictEqual(result[2], obj);
    assert.strictEqual(result[3], obj);
    assert.strictEqual(result[4], undefined);
  });

  it('should work with url rewrite', async function () {
    const router = Router();
    const result = [];
    router.use('/a', function (req, resp, next) {
      req.url = '/b/c';
      return next();
    });
    router.use('/b', function (req, resp, next) {
      result.push(`${req.url}`);
      return next();
    });

    await router({ method: 'GET', url: '/a/b/c' });
    await router({ method: 'GET', url: '/b/c/d' });
    assert.deepStrictEqual(result, ['/b/c', '/b/c/d']);
  });

  describe('router params', function () {
    it('should expose req.params', async function () {
      const router = Router({ params: { name: '1' } });

      const result = [];
      router.use('/a', function (req, resp, next) {
        result.push(req.params);
        return next();
      });
      await router({ method: 'GET', url: '/a/b' });
      assert.deepStrictEqual(result, [{ name: '1' }]);
    });
    it('should merge route path pattern params to req.params', async function () {
      const router = Router({ params: { a: '1', b: '2' } });

      const result = [];
      router.use('/:a', function (req, resp, next) {
        result.push(req.params);
        return next();
      });
      await router({ method: 'GET', url: '/a/b' });
      assert.deepStrictEqual(result, [{ a: 'a', b: '2' }]);
    });
  });

  describe('check req.routePath', function () {
    it('should work in simple case', async function () {
      const router = Router();

      const result = [];
      router.use('/a', function route(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      });

      await router({ method: 'GET', url: '/a/b' });
      assert.deepStrictEqual(result, [
        '/a /b',
      ]);
    });
    it('should work in nested routers', async function () {
      const routerA = Router(),
        routerB = Router();

      const result = [];
      routerA.use('/a', routerB);
      routerB.use('/b', function route(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      });

      await routerA({ method: 'GET', url: '/a/b/c' });
      assert.deepStrictEqual(result, [
        '/a/b /c',
      ]);
    });

    it('should work with dynamic path pattern and not influence other requests in router', async function () {
      const router = Router(),
        routerA = Router(),
        routerB = Router();

      const result = [];
      const middleware = async function route(req, resp, next) {
        await sleep(req.params.child * 50);
        result.push(`${req.url} ${req.routePath}`);
        return next();
      };
      routerA.use('/:child', middleware);
      routerB.use('/:child', middleware);
      router.use('/:parent', routerA, routerB);

      await Promise.all([
        router({ method: 'GET', url: '/b/2' }),
        router({ method: 'GET', url: '/a/1' }),
        router({ method: 'GET', url: '/c/3' }),
      ]);
      assert.deepStrictEqual(result.sort(), [
        '/a/1 /a/1', '/a/1 /a/1',
        '/b/2 /b/2', '/b/2 /b/2',
        '/c/3 /c/3', '/c/3 /c/3',
      ]);
    });
  });
});
