/* eslint-env mocha*/
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

const assert = require('assert');
const request = require('supertest');
const http = require('http');
const url = require('url');
const { when, end404, sleep } = require('./helper');
const Router = require('..');

describe('router http', function () {
  it('should respond with the right path pattern', function (done) {
    const router = Router(),
      app = http.createServer((req, resp) => router(req, resp));
    app.on('error', done);

    router.use(function (req, resp, next) {
      return next();
    }).all('/', function (req, resp, next) {
      resp.end('/');
    }).all('/a/:b/c', function (req, resp, next) {
      resp.end('/a/b/c');
    }).use('/a/', function (req, resp, next) {
      const rel = url.parse(req.url).pathname.slice('/a'.length);
      const relative = req.url.slice(req.routePath.length);
      assert.equal(relative, rel === '/' ? '' : rel);
      resp.end(relative);
    })
    .all('/1/:a/:b', function (req, resp, next) {
      resp.end(req.params.a + req.params.b);
    })
    .use(end404);

    const req = request(app.listen());
    const cb = when(7, done);
    req.get('/').expect(200, '/', cb);
    req.get('/a').expect(200, '', cb);
    req.get('/a/').expect(200, '', cb);
    req.get('/a.html').expect(404, cb);
    req.get('/a/b').expect(200, '/b', cb);
    req.get('/a/b/c').expect(200, '/a/b/c', cb);
    req.get('/1/a/b.c.html').expect(200, 'ab.c.html', cb);
  });

  it('should respond only for get or post', function (done) {
    const router = Router(),
      app = http.createServer((req, resp) => router(req, resp));
    app.on('error', done);
    router.get('/', function (req, resp, next) {
      resp.end('get /');
    }).post('/', function (req, resp, next) {
      resp.end('post /');
    }).use(end404);

    const req = request(app.listen());
    const cb = when(2, done);
    req.get('/').expect(200, 'get /', cb);
    req.post('/').expect(200, 'post /', cb);
  });

  it('should respond right with nested router', function (done) {
    const ra = Router(),
      app = http.createServer((req, resp) => ra(req, resp));
    app.on('error', done);

    const rb = Router();
    ra.use('/a', rb).post('/b', function (req, resp, next) {
      resp.end('post /b');
    }).use(end404);

    rb.get('/', function (req, resp, next) {
      resp.end(req.url.slice(req.routePath.length));
    }).post('/b', function (req, resp, next) {
      resp.end('post /a/b');
    }).use('/c', function (req, resp, next) {
      resp.end(req.url.slice(req.routePath.length));
    });

    const req = request(app.listen());
    const cb = when(8, done);
    req.post('/b').expect(200, 'post /b', cb);
    req.get('/a').expect(200, '', cb);
    req.post('/a').expect(404, cb);
    req.get('/a/b').expect(404, cb);
    req.post('/a/b').expect(200, 'post /a/b', cb);
    req.get('/a/c').expect(200, '', cb);
    req.get('/a/c/a').expect(200, '/a', cb);
    req.get('/a/c/a/b').expect(200, '/a/b', cb);
  });

  it('should respond right with multiple router', function (done) {
    const router = Router(),
      app = http.createServer((req, resp) => router(req, resp));
    app.on('error', done);

    const ra = Router(),
      rb = Router();
    router.use(ra, rb).use(end404);

    ra.get('/a', function (req, resp, next) {
      resp.end('1 get /a');
    }).use('/b', function (req, resp, next) {
      resp.write('1 /b');
      return next();
    });

    rb.get('/a', function (req, resp, next) {
      resp.statusCode = 302;
      resp.setHeader('Location', 'http://tianjianchn.org');
      resp.end();
    }).get('/b', function (req, resp, next) {
      resp.end('2 get');
    });

    const req = request(app.listen());
    const cb = when(3, done);
    req.get('/a').expect(200, '1 get /a', cb);
    req.get('/b').expect(200, '1 /b2 get', cb);
    req.post('/b').expect(200, '1 /b', cb);
  });

  it('should respond right with multiple callback', function (done) {
    const router = Router(),
      app = http.createServer((req, resp) => router(req, resp));
    app.on('error', done);
    router.get('/a', function (req, resp, next) {
      resp.write('1');
      next();
    }, function (req, resp, next) {
      resp.end('2');
    }, function (req, resp, next) { // never comes here
      resp.end('3');
    }).use(end404);

    const req = request(app.listen());
    const cb = when(1, done);
    req.get('/a').expect(200, '12', cb);
  });

  it('should respond right with router params', function (done) {
    const router = Router({ params: { name: 'value' } }),
      app = http.createServer((req, resp) => router(req, resp));
    app.on('error', done);
    router.get('/a', function (req, resp, next) {
      resp.write(req.params.name);
      next();
    }).get('/b/:name?', function (req, resp, next) {
      resp.end(req.params.name);
    }).use(end404);

    const req = request(app.listen());
    const cb = when(3, done);
    req.get('/a').expect(200, 'value', cb);
    req.get('/b').expect(200, 'value', cb);
    req.get('/b/1').expect(200, '1', cb);
  });

  describe('url rewrite', function () {
    it('should respond right with rewrite once', function (done) {
      const router = Router(),
        app = http.createServer((req, resp) => router(req, resp));
      app.on('error', done);
      router.get('/a', function (req, resp, next) {
        req.url = '/b';
        return next();
      });
      router.get('/b', function (req, resp, next) {
        resp.end('b');
      });
      router.use(end404);

      const req = request(app.listen());
      const cb = when(1, () => sleep(100).then(done));
      req.get('/a').expect(200, 'b', cb);
    });

    it('should respond right with rewrite twice', function (done) {
      const router = Router(),
        app = http.createServer((req, resp) => router(req, resp));
      app.on('error', done);
      router.get('/a', function (req, resp, next) {
        req.url = '/b';
        return next();
      }, function (req, resp, next) {
        req.url = '/c';
        return next();
      });
      router.get('/b', function (req, resp, next) {
        resp.end('b');
      });
      router.get('/c', function (req, resp, next) {
        resp.end('c');
      });
      router.use(end404);

      const req = request(app.listen());
      const cb = when(1, () => sleep(100).then(done));
      req.get('/a').expect(200, 'c', cb);
    });
  });
});
