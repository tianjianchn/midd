
const assert = require('assert');
const request = require('supertest');
const middHeader = require('..');
const Server = require('midd');

describe('use-header', () => {
  it('should work', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(middHeader());
    app.use((req, resp, next) => {
      assert.equal(req.get('Content-Type'), 'text/html');
      assert.equal(req.get('content-type'), 'text/html');
      resp.set('Cache-Control', 'public, max-age=0');
      resp.end('hello');
    });

    const req = request(app.listen());
    req.get('/').set('Content-Type', 'text/html').expect('Cache-Control', 'public, max-age=0').expect(200, done);
  });
});
