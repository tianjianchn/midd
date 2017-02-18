
const assert = require('assert');
const request = require('supertest');
const useServer = require('..');

describe('midd', function () {
  describe('respond 404', function () {
    it('should work with 0 middleware', async function () {
      const app = createApp();
      const req = request(app.listen());
      await req.get('/').expect(404, 'Not Found');
      await req.get('/any').expect(404);
      await req.get('/a/n/y').expect(404);
      await req.get('/a.n').expect(404);
      await req.get('/a/n.y').expect(404);
    });

    it('should work with nothing-to-do middleware', async function () {
      const app = createApp();
      app.use(function () {});
      const req = request(app.listen());
      await req.get('/').expect(404, 'Not Found');
      await req.get('/any').expect(404);
      await req.get('/a/n/y').expect(404);
      await req.get('/a.n').expect(404);
      await req.get('/a/n.y').expect(404);
    });

    it('should work with no-response middleware', async function () {
      const app = createApp();
      app.use(function (req, resp, next) {
        return next();
      });
      const req = request(app.listen());
      await req.get('/').expect(404, 'Not Found');
    });
  });

  describe('respond 200', function () {
    it('should work with sync middleware', async function () {
      const app = createApp();
      app.use(function (req, resp) {
        resp.end(req.url);
      });
      const req = request(app.listen());
      await req.get('/').expect(200, '/');
      await req.get('/any').expect(200, '/any');
      await req.get('/a/n/y').expect(200, '/a/n/y');
      await req.get('/a/n.y').expect(200, '/a/n.y');
    });

    it('should work with async middleware', async function () {
      const app = createApp();
      app.use(function (req, resp, next) {
        return next();
      });
      app.use(function (req, resp) {
        return new Promise(resolve => setTimeout(() => {
          resp.end('haha');
          resolve();
        }));
      });
      const req = request(app.listen());
      await req.get('/').expect(200, 'haha');
    });

    it('should work even when resp.end() not called explicitly', async function () {
      const app = createApp();
      app.use(function (req, resp) {
        resp.writeHead(403);
      });
      const req = request(app.listen());
      await req.get('/').expect(403);
    });
  });

  describe('misc', function () {
    it('should has req.app', async function () {
      const app = createApp();
      app.use(function (req, resp, next) {
        assert.strictEqual(app, req.app);
        assert.strictEqual(app, this);
        resp.end('hello');
      });
      const req = request(require('http').createServer(app.listener()));
      await req.get('/').expect(200, 'hello');
    });

    it('should work with the listener method', async function () {
      const app = createApp();
      const req = request(require('http').createServer(app.listener()));
      await req.get('/').expect(404);
    });

    it('should throw with not-function in use()', function () {
      const app = createApp();
      app.use();
      assert.throws(() => app.use(1), TypeError);
    });

    it('should respond right with req.forward use', async function () {
      const app = createApp();
      app.use(function (req, resp, next) {
        if (req.url === '/f') {
          assert.equal(req.originalUrl, '/a');
          return resp.end(req.url);
        }
        return next();
      });
      app.use(function (req, resp, next) {
        if (req.url === '/a') {
          return req.forward('/f');
        }
        return next();
      });
      const req = request(app.listen());
      await req.get('/a').expect(200, '/f');
      await req.get('/b').expect(404, 'Not Found');
    });
  });
});

function createApp() {
  const app = useServer();
  app.on('error', (err) => {
    throw err;
  });
  return app;
}
