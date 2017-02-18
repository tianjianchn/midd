
const assert = require('assert');
const request = require('supertest');
const Server = require('midd');
const middUrl = require('..');

describe('url middleware', () => {
  it('should expose url related property on req', (done) => {
    const app = Server();
    app.use(middUrl());
    let port;

    app.use((req, resp, next) => {
      try {
        assert.equal(req.href, '/path/to/dest.html?query=string');
        assert.equal(req.protocol, 'http:');
        assert.equal(req.auth, null);

        assert.equal(req.host, `127.0.0.1:${port}`);
        assert.equal(req.hostname, '127.0.0.1');
        assert.equal(req.port, port);

        assert.equal(req.path, '/path/to/dest.html?query=string');
        assert.equal(req.pathname, '/path/to/dest.html');
        assert.equal(req.search, '?query=string');

        assert.deepEqual(req.query, { query: 'string' });
        done();
      } catch (e) {
        done(e);
      }
    });

    const server = app.listen();
    port = server.address().port;
    const req = request(server);
    req.get('/path/to/dest.html?query=string#anchor').end();
  });
});
