
const assert = require('assert');
const request = require('supertest');
const when = require('after');
const Server = require('midd');
const mwip = require('..');
// const _ = require('underscore');

describe('ip middleware', () => {
  it('should expose ip on req', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(mwip());
    app.use((req, resp, next) => {
      if (req.url.indexOf('ips') >= 0) {
        resp.end(JSON.stringify(req.ips));
      } else resp.end(req.ip);
    });

    const req = request(app.listen());
    const cb = when(2, done);
    req.get('/ips').expect(200, (err, resp) => {
      if (err) return cb(err);
      const ip = JSON.parse(resp.text)[0];
      assert(ip === '127.0.0.1' || ip === '::ffff:127.0.0.1');
      cb();
    });
    req.get('/ip').expect(200, (err, resp) => {
      if (err) return cb(err);
      const ip = resp.text;
      assert(ip === '127.0.0.1' || ip === '::ffff:127.0.0.1');
      cb();
    });
  });

  it('should expose ip on req after proxy', (done) => {
    const app = Server();
    app.on('error', done);
    app.use(mwip(true));
    app.use((req, resp, next) => {
      if (req.url.indexOf('ips') >= 0) {
        resp.end(JSON.stringify(req.ips));
      } else resp.end(req.ip);
    });

    const req = request(app.listen());
    const cb = when(2, done);
    req.get('/ips').set('X-Forwarded-For', '1.1.1.1,127.0.0.1').expect(200, JSON.stringify(['1.1.1.1', '127.0.0.1']), cb);
    req.get('/ip').set('X-Forwarded-For', '1.1.1.1,127.0.0.1').expect(200, '1.1.1.1', cb);
  });
});
