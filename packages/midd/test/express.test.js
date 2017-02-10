/* eslint-env mocha */
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off */

const request = require('supertest');
const middServer = require('..');

describe('midd express', function () {
  it('should work work with mixed express and midd middlewares', function (done) {
    const app = middServer();
    app.on('error', done);

    app.express.use((req, resp, next) => {
      next();
    });
    app.use((req, resp, next) => next());

    const router = app.express.Router();
    router.use((req, resp, next) => next());
    router.express.use((req, resp, next) => {
      next();
    });
    router.express.use((req, resp, next) => {
      resp.end('hello');
    });
    app.use(router);

    const req = request(app.listen());
    req.get('/').expect(200, 'hello', done);
  });
});

