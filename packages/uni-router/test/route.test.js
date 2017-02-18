
const assert = require('assert');
// const url = require('url');
const compose = require('uni-compose');
const { sleep } = require('./helper');
const Router = require('..');

describe('route', function () {
  it('should keep this context in routes', async function () {
    const router = Router();

    const obj = {},
      result = [];
    router.use(function (req, resp, next) {
      result.push(this);
    });

    await router.call(obj, { method: 'GET', url: '/' });

    // Simulate router attach to app(app.use(router))
    await compose(router).call(obj, { method: 'GET', url: '/' });

    assert.strictEqual(result[0], obj);
    assert.strictEqual(result[1], obj);
    assert.strictEqual(result[2], undefined);
  });

  describe('verb match', function () {
    it('should match get/post...', async function () {
      const router = Router();

      const result = [];
      router.get(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      router.post(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      router.put(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      router.delete(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      router.options(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      router.head(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      await router({ method: 'POST', url: '/' });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'OPTIONS', url: '/' });
      await router({ method: 'DELETE', url: '/' });
      await router({ method: 'PUT', url: '/' });
      await router({ method: 'HEAD', url: '/' });
      assert.deepStrictEqual(result, ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'HEAD']);
    });

    it('should match any methods in use()', async function () {
      const router = Router();

      const result = [];
      router.use(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      await router({ method: 'POST', url: '/' });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'OPTIONS', url: '/' });
      await router({ method: 'DELETE', url: '/' });
      await router({ method: 'PUT', url: '/' });
      await router({ method: 'HEAD', url: '/' });
      assert.deepStrictEqual(result, ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'HEAD']);
    });
    it('should match any methods in all()', async function () {
      const router = Router();

      const result = [];
      router.all(function (req, resp, next) {
        result.push(req.method);
        return next();
      });
      await router({ method: 'POST', url: '/' });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'OPTIONS', url: '/' });
      await router({ method: 'DELETE', url: '/' });
      await router({ method: 'PUT', url: '/' });
      await router({ method: 'HEAD', url: '/' });
      assert.deepStrictEqual(result, ['POST', 'GET', 'OPTIONS', 'DELETE', 'PUT', 'HEAD']);
    });
  });

  describe('path pattern match', function () {
    it('should match full url in get/post/all...', async function () {
      const router = Router();

      const result = [];
      router.get(function (req, resp, next) {
        result.push(`${req.url} `);
        return next();
      });
      router.get('/', function (req, resp, next) {
        result.push(req.url);
        return next();
      });
      router.get('/a', function (req, resp, next) {
        result.push(req.url);
        return next();
      });
      router.get('/a/', function (req, resp, next) { // tailing / is optional(strict: false)
        result.push(`${req.url} /`);
        return next();
      });
      router.get('/a.b', function (req, resp, next) {
        result.push(req.url);
        return next();
      });
      router.get('/a/b', function (req, resp, next) {
        result.push(req.url);
        return next();
      });
      router.get('/a/b.c.d', function (req, resp, next) {
        result.push(req.url);
        return next();
      });
      router.get('/a/b/c.d?e=f', function (req, resp, next) {
        result.push(req.url);
        return next();
      });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'GET', url: '/a' });
      await router({ method: 'GET', url: '/a/' });
      await router({ method: 'GET', url: '/A' });
      await router({ method: 'GET', url: '/b' });
      await router({ method: 'GET', url: '/a.b' });
      await router({ method: 'GET', url: '/a/b' });
      await router({ method: 'GET', url: '/a/b.c.d' });
      await router({ method: 'GET', url: '/a/b/c.d?e=f' });
      assert.deepStrictEqual(result, ['/ ', '/', '/a', '/a /', '/a/', '/a/ /', '/A', '/A /', '/a.b', '/a/b', '/a/b.c.d', '/a/b/c.d?e=f']);
    });
    it('should match the start url in use()', async function () {
      const router = Router();

      const result = [];
      router.use(function (req, resp, next) {
        result.push(`empty ${req.url}`);
        return next();
      });
      router.use('/', function (req, resp, next) {
        result.push(`/ ${req.url}`);
        return next();
      });
      router.use('/a', function (req, resp, next) {
        result.push(`/a ${req.url}`);
        return next();
      });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'GET', url: '/a' });
      await router({ method: 'GET', url: '/b' });
      await router({ method: 'GET', url: '/a.b' });
      await router({ method: 'GET', url: '/a/b' });
      assert.deepStrictEqual(result, [
        'empty /', '/ /', 'empty /a',
        '/ /a', '/a /a',
        'empty /b', '/ /b',
        'empty /a.b', '/ /a.b', // /a.b not match /a
        'empty /a/b', '/ /a/b', '/a /a/b',
      ]);
    });
  });
  describe('path pattern params', function () {
    it('should has no params in literal pattern', async function () {
      const router = Router();

      const result = [];
      router.use('/a', function (req, resp, next) {
        result.push(req.params);
        return next();
      });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'GET', url: '/a' });
      await router({ method: 'GET', url: '/a/b' });
      assert.deepStrictEqual(result, [{}, {}]);
    });

    it('should has params with placeholder', async function () {
      const router = Router();

      const result = [];
      router.use('/:name', function (req, resp, next) {
        result.push(req.params);
        return next();
      });
      router.use('/2/:type/1', function (req, resp, next) {
        result.push(req.params);
        return next();
      });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'GET', url: '/a' });
      await router({ method: 'GET', url: '/b/c' });
      await router({ method: 'GET', url: '/2/' });
      await router({ method: 'GET', url: '/2/a/' });
      await router({ method: 'GET', url: '/2/b/1' });
      assert.deepStrictEqual(result, [
        { name: 'a' }, { name: 'b' }, { name: '2' }, { name: '2' }, { name: '2' },
        { type: 'b' },
      ]);
    });
  });

  describe('check req.routePath', function () {
    it('should work in a route with one middleware', async function () {
      const router = Router();

      const result = [];
      router.use(function route1(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      });
      router.use('/a', function route2(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'GET', url: '/a' });
      await router({ method: 'GET', url: '/a/' });
      await router({ method: 'GET', url: '/a/b' });
      assert.deepStrictEqual(result, [
        '/ ',
        ' /a', '/a ',
        ' /a/', '/a/ ',
        ' /a/b', '/a /b',
      ]);
    });
    it('should work in a route with multiple middlewares', async function () {
      const router = Router();

      const result = [];
      router.use(function route1(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      }, function route2(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      });
      router.use('/a', function route3(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      }, function route4(req, resp, next) {
        result.push(`${req.routePath} ${req.url.slice(req.routePath.length)}`);
        return next();
      });
      await router({ method: 'GET', url: '/' });
      await router({ method: 'GET', url: '/a' });
      await router({ method: 'GET', url: '/a/' });
      await router({ method: 'GET', url: '/a/b' });
      assert.deepStrictEqual(result, [
        '/ ', '/ ',
        ' /a', ' /a', '/a ', '/a ',
        ' /a/', ' /a/', '/a/ ', '/a/ ',
        ' /a/b', ' /a/b', '/a /b', '/a /b',
      ]);
    });
    it('should work with dynamic path pattern and not influence other requests in route', async function () {
      const router = Router();

      const result = [];
      router.use('/:action', async function route(req, resp, next) {
        await sleep(req.params.action * 50);
        result.push(`${req.url} ${req.routePath}`);
        return next();
      });
      await Promise.all([
        router({ method: 'GET', url: '/2' }),
        router({ method: 'GET', url: '/1' }),
        router({ method: 'GET', url: '/3' }),
      ]);
      assert.deepStrictEqual(result, [
        '/1 /1',
        '/2 /2',
        '/3 /3',
      ]);
    });
    describe('routePath match', function () {
      it('should not match when changed the url among routes', async function () {
        const routerA = Router(),
          routerB = Router();

        const result = [];
        routerB.use('/b', function (req, resp, next) {
          result.push(`use ${req.url}`);
          req.url = '/c';
          return next();
        });
        routerB.get('/b', function (req, resp, next) {
          result.push(`get ${req.url}`);
          return next();
        });
        routerA.use('/a', routerB);
        await routerA({ method: 'GET', url: '/a/b' });
        assert.deepStrictEqual(result, [
          'use /a/b',
        ]);
      });
      it('should not match when changed the url among middlewares in one route', async function () {
        const router = Router();

        const result = [];
        router.use('/a', function (req, resp, next) {
          result.push(`1 ${req.url}`);
          req.url = '/b';
          return next();
        }, function (req, resp, next) {
          result.push(`2 ${req.url}`);
          return next();
        });
        await router({ method: 'GET', url: '/a' });
        assert.deepStrictEqual(result, [
          '1 /a',
        ]);
      });
    });
  });
});
