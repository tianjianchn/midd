/* eslint-env mocha*/
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off, no-plusplus:off */

const assert = require('assert');
const request = require('supertest');
const when = require('after');
const helper = require('./helper');

describe('subsequent access(with cookie)', () => {
  it('should load session from cookie sid', (done) => {
    const app = helper.createApp();
    let count = 0;
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`session ${req.session.n}`);
    });
    const req = request.agent(app.server);
    req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'session 1', (err) => {
      if (err) return done(err);
      req.get('/').expect(helper.shouldNotSetCookies()).expect(200, 'session 1', (err) => {
        if (err) return done(err);
        assert.equal(app.store.length, 1);
        done();
      });
    });
  });

  it('should save the empty session and not create new session', (done) => {
    const app = helper.createApp();
    app.use((req, resp, next) => {
      resp.end('hello');
    });
    const req = request.agent(app.server);
    req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'hello', (err) => {
      if (err) return done(err);
      req.get('/').expect(helper.shouldNotSetCookies()).expect(200, 'hello', (err) => {
        if (err) return done(err);
        assert.equal(app.store.length, 1);
        done();
      });
    });
  });

  it('should not remove cookie when destroy', (done) => {
    const app = helper.createApp();
    let count = 0;
    app.use((req, resp, next) => {
      if (req.url === '/') {
        req.session.n = req.session.n || ++count;
        resp.end(`session ${req.session.n}`);
      } else if (req.url === '/destroy') {
        req.session.destroy();
      }
    });
    const req = request.agent(app.server);
    req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'session 1', (err, resp) => {
      if (err) return done(err);
      const oldCookieId = helper.getCookie(resp, 'use.sid');
      req.get('/destroy').expect(404, (err, res) => {
        if (err) return done(err);
        const newCookieId = helper.getCookie(res, 'use.sid');
        assert.notEqual(newCookieId, oldCookieId);
        // helper.cookies(res);
        // assert.equal(res.cookies.length, 1);
        // assert.equal(app.store.length, 0);
        // assert.equal(res.cookies[0].Expires, 'Thu, 01 Jan 1970 00:00:00 GMT');

        req.get('/').expect(200, 'session 2', done);
      });
    });
  });

  it('should not set cookie if req.session id not changed', (done) => {
    let count = 0;
    const app = helper.createApp();
    app.use((req, resp, next) => {
      if (req.url === '/') {
        req.session.a = ++count;
        resp.end(`count ${req.session.a}`);
      } else if (req.url === '/nochange') {
        req.session.b = 1;
        req.session.b = undefined;
        resp.end(`count ${req.session.a}`);
      }
    });
    const req = request.agent(app.server);
    req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'count 1', (err) => {
      if (err) return done(err);
      req.get('/nochange').expect(helper.shouldNotSetCookies()).expect(200, 'count 1', (err) => {
        if (err) return done(err);
        assert.equal(app.store.length, 1);
        req.get('/b').expect(helper.shouldNotSetCookies()).expect(404, done);
      });
    });
  });

  it('should not set cookie if req.session modified', (done) => {
    let count = 0;
    const app = helper.createApp();
    app.use((req, resp, next) => {
      req.session.a = ++count;
      resp.end(`count ${req.session.a}`);
    });
    const req = request.agent(app.server);
    req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'count 1', (err) => {
      if (err) return done(err);
      req.get('/').expect(helper.shouldNotSetCookies()).expect(200, 'count 2', (err) => {
        if (err) return done(err);
        assert.equal(app.store.length, 1);
        req.get('/').expect(helper.shouldNotSetCookies()).expect(200, 'count 3', done);
      });
    });
  });

  it('should save the new data when remove a req.session property', (done) => {
    const app = helper.createApp();
    app.use((req, resp, next) => {
      if (req.url === '/1') {
        req.session.n = 1;
      } else {
        delete req.session.n;
      }
      resp.end(`${req.session.n}`);
    });
    const req = request.agent(app.server);
    req.get('/1').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, '1', (err) => {
      if (err) return done(err);
      req.get('/2').expect(helper.shouldNotSetCookies()).expect(200, 'undefined', (err) => {
        if (err) return done(err);
        const sess = helper.firstSession(app.store);
        assert.equal(sess.data.n, undefined);
        done();
      });
    });
  });

  it('should generate new session when cookie id not properly signed', (done) => {
    let count = 0;
    const app = helper.createApp();
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`session ${req.session.n}`);
    });
    const req = request(app.server);
    req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'session 1', (err, resp) => {
      if (err) return done(err);
      req.get('/').set('Cookie', `use.sid=${resp.cookieId}`)
      .expect(helper.shouldNotSetCookies()).expect(200, 'session 1', (err) => {
        if (err) return done(err);
        assert.equal(app.store.length, 1);
        req.get('/').set('Cookie', `${resp.cookieId}1`)
        .expect(helper.shouldSetCookie('use.sid')).expect(200, 'session 2', done);
      });
    });
  });
  it('should generate new session when session is expired', (done) => {
    let count = 0;
    const app = helper.createApp({ ttl: '50ms' });
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`session ${req.session.n}`);
    });
    const req = request.agent(app.server);
    req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'session 1', (err) => {
      if (err) return done(err);
      req.get('/').expect(helper.shouldNotSetCookies()).expect(200, 'session 1', (err) => {
        if (err) return done(err);
        assert.equal(app.store.length, 1);
        setTimeout(() => {
          req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, 'session 2', done);
        }, 50);
      });
    });
  });
  it('should has no req.session when cookie path not match', (done) => {
    let count = 0;
    const app = helper.createApp({ cookie: { path: '/session' } });
    app.on('error', (err) => {
      assert.equal(err.message, "Cannot read property 'n' of undefined");
    });
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`session ${req.session.n}`);
    });
    const req = request.agent(app.server);
    req.get('/session').expect(helper.shouldHasSession(app.store, 'use.sid', '/session')).expect(200, 'session 1', (err) => {
      if (err) return done(err);

      const cb = when(3, done);
      req.get('/session/1').expect(helper.shouldNotSetCookies()).expect(200, 'session 1', cb);
      req.get('/session1').expect(helper.shouldNotSetCookies()).expect(200, 'session 1', cb);
      req.get('/nosession').expect(helper.shouldNotSetCookies()).expect(500, cb);
    });
  });

  it('should work when destroy session after writeHead()');

  describe('touch', () => {
    it('should always touch when through session middleware ', (done) => {
      const app = helper.createApp();
      app.use((req, resp, next) => {
        if (req.url === '/1') {
          req.session.n = 1;
          resp.end(`${req.session.n}`);
        } else resp.end('2');
      });
      const req = request.agent(app.server);
      req.get('/1').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, '1', (err) => {
        if (err) return done(err);
        const sess = helper.firstSession(app.store);
        req.get('/2').expect(helper.shouldNotSetCookies()).expect(200, '2', (err) => {
          if (err) return done(err);
          assert.equal(app.store.length, 1);
          const newSess = helper.firstSession(app.store);
          assert.equal(newSess.id, sess.id);
          assert.notEqual(newSess.start, sess.start);
          done();
        });
      });
    });
  });
});
