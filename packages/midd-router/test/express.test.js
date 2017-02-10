/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

// const assert = require('assert');
const http = require('http');
const request = require('supertest');
const Router = require('..');

describe('router.express.VERB', function () {
  it('should work when call next', function (done) {
    const router = Router(),
      app = http.createServer((req, resp) => router(req, resp));
    app.on('error', done);

    let result;
    router.express.use((req, resp, next) => {
      result = [];
      result.push(1);
      setTimeout(next, 10);
      result.push(2);
    });
    router.express.all((req, resp, next) => {
      result.push(3);
      resp.end(JSON.stringify(result));
    });

    const req = request(app.listen());
    req.get('/').expect(200, '[1,2,3]', done);
  });
  it('should work with mixed express and midd middlewares', function (done) {
    const router = Router(),
      app = http.createServer((req, resp) => router(req, resp));
    app.on('error', done);

    router.use((req, resp, next) => next());
    router.express.use((req, resp, next) => {
      next();
    });
    router.express.use((req, resp, next) => {
      resp.end('hello');
    });

    const req = request(app.listen());
    req.get('/').expect(200, 'hello', done);
  });
});
