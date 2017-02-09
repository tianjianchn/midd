/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

const assert = require('assert');
const request = require('supertest');
const useServer = require('..');

describe('midd error handle', function () {
  describe('default handler', function () {
    it('should catch the thrown error', function (done) {
      const cb = when(2, done);
      const app = useServer();
      const cerr = console.error;
      console.error = function (...args) {
        const msg = require('util').format(...args);
        assert.equal('Caught an error in use-server: Error: mw error', msg.split('\n')[0]);
        console.error = cerr;
        cb();
      };
      app.use((req, resp, next) => {
        throw new Error('mw error');
      });
      const req = request(app.listen());
      req.get('/').expect(500, 'mw error', cb);
    });

    it('should catch the error without stack property', function (done) {
      const cb = when(2, done);
      const app = useServer();
      const err = console.error;
      console.error = function (...args) {
        const msg = require('util').format(...args);
        assert.equal('Caught an error in use-server: mw error', msg.split('\n')[0]);
        console.error = err;
        cb();
      };
      app.use(function (req, resp, next) {
        const err = new Error();
        err.stack = null;
        err.toString = () => 'mw error';
        throw err;
      });
      const req = request(app.listen());
      req.get('/').expect(500, cb);
    });

    it('should catch the error which is literal', function (done) {
      const cb = when(2, done);
      const app = useServer();
      const err = console.error;
      console.error = function (...args) {
        const msg = require('util').format(...args);
        assert.equal('Caught an error in use-server: 2', msg.split('\n')[0]);
        console.error = err;
        cb();
      };
      app.use(function (req, resp, next) {
        throw 2;//eslint-disable-line
      });
      const req = request(app.listen());
      req.get('/').expect(500, cb);
    });
  });

  describe('response/socket error', function () {
    it('should handle response error event', function (done) {
      const cb = when(8, done);
      const app = useServer();
      app.use(function (req, resp) {
        resp.emit('error', new Error('response error'));
      });
      app.on('error', function (err) {
        assert.equal(err.message, 'response error');
        cb();
      });
      const req = request(app.listen());
      req.get('/').expect(500, cb);
      req.get('/any').expect(500, cb);
      req.get('/a/n/y').expect(500, cb);
      req.get('/any.html').expect(500, cb);
    });

    it('should handle response error after write', function (done) {
      const cb = when(2, done);
      const app = useServer();
      app.use(function (req, resp) {
        resp.statusCode = 404;
        resp.write('404');
        resp.emit('error', new Error('response error'));
      });
      app.on('error', function (err) {
        assert.equal(err.message, 'response error');
        cb();
      });
      const req = request(app.listen());
      req.get('/').expect(404, '404', cb);
    });

    it('should handle socket error event', function (done) {
      const cb = when(2, done);
      const app = useServer();
      app.use(function (req, resp) {
        resp.socket.emit('error', new Error('socket error'));
      });
      app.on('error', function (err) {
        assert.equal(err.message, 'socket error');
        cb();
      });
      const req = request(app.listen());
      req.get('/').end((err, resp) => {
        assert.equal(err.message, 'socket hang up');
        assert.equal(resp, undefined);
        cb();
      });
    });
  });

  describe('misc', function () {
    it("should respond error's statusCode/status/code", function (done) {
      const cb = when(6, done);
      const app = useServer();
      app.use(function (req) {
        let err;
        if (req.url === '/statusCode') {
          err = new Error('data invalid');
          err.statusCode = 400;
        } else if (req.url === '/status') {
          err = new Error();
          err.status = 401;
        } else if (req.url === '/code') {
          err = new Error();
          err.code = 599;
        }
        throw err;
      });
      app.on('error', e => cb());
      const req = request(app.listen());
      req.get('/statusCode').expect(400, 'data invalid', cb);
      req.get('/status').expect(401, 'Unauthorized', cb);
      req.get('/code').expect(599, 'Unknown Error', cb);
    });

    it('should limit status code value', function (done) {
      const cb = when(10, done);
      const app = useServer();
      app.use(function (req) {
        let statusCode;
        switch (req.url) {
          case '/100': statusCode = 100; break;
          case '/200': statusCode = 200; break;
          case '/302': statusCode = 300; break;
          case '/string': statusCode = '400'; break;
          case '/false': statusCode = 'false'; break;
        }
        const err = new Error();
        err.statusCode = statusCode;
        throw err;
      });
      app.on('error', e => cb());
      const req = request(app.listen());
      req.get('/100').expect(500, 'Internal Server Error', cb);
      req.get('/200').expect(500, 'Internal Server Error', cb);
      req.get('/302').expect(500, 'Internal Server Error', cb);
      req.get('/string').expect(400, 'Bad Request', cb);
      req.get('/false').expect(500, 'Internal Server Error', cb);
    });

    it('should not change response when error thrown after headersSent', function (done) {
      const cb = when(2, done);
      const app = useServer();
      app.use(function (req, resp) {
        resp.writeHead(403);
        throw new Error('something wrong');
      });
      app.on('error', function (err) {
        assert.equal(err.message, 'something wrong');
        cb();
      });
      const req = request(app.listen());
      req.get('/').expect(403, '', cb);
    });

    it('should emit error when set headers after writeHead', function (done) {
      const cb = when(2, done);
      const app = useServer();
      app.use(function (req, resp) {
        resp.writeHead(403);
        resp.setHeader('x-any', 'any');
      });
      app.on('error', function (err) {
        assert.equal(err.message, "Can't set headers after they are sent.");
        cb();
      });
      const req = request(app.listen());
      req.get('/').expect(403, '', cb);
    });

    it('should emit error when set headers after end', function (done) {
      const cb = when(2, done);
      const app = useServer();
      app.use(function (req, resp) {
        resp.statusCode = 200;
        resp.end('hello');
        resp.setHeader('Content-Type', 'text/text');
      });
      app.on('error', function (err) {
        assert.equal(err.message, "Can't set headers after they are sent.");
        cb();
      });
      const req = request(app.listen());
      req.get('/').expect(200, 'hello', cb);
    });

    it('should catch downstream middleware error', function (done) {
      const cb = when(1, done);
      const app = useServer();
      app.use(async (req, resp, next) => {
        try {
          await next();
          resp.end('hello');
        } catch (e) {
          resp.end(`catch error: ${e.message}`);
        }
      });
      app.use(function (req, resp, next) {
        throw new Error('mw error');
      });
      app.on('error', e => cb());
      const req = request(app.listen());
      req.get('/').expect(200, 'catch error: mw error', cb);
    });
  });
});

function when(times, cb) {
  let called = 0,
    error;
  return (err) => {
    if (err) error = err;
    called += 1;
    if (called >= times) return cb(error);
  };
}
