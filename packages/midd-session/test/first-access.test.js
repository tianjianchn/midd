
const assert = require('assert');
const helper = require('./helper');

describe('first access(without cookie)', () => {
  it('should create a new session', (done) => {
    const app = helper.createApp(done);
    app.use((req, resp) => {
      req.session.name = 'tianjianchn';
    });
    app.req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(404, app.done);
  });

  it('should create multiple sessions', (done) => {
    const app = helper.createApp((err) => {
      if (err) return done(err);
      assert.equal(app.store.length, 3);
      done();
    });

    let count = 0;
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`session ${req.session.n}`);
    });
    app.req.get('/').expect(helper.shouldSetCookie('use.sid')).expect(200, 'session 1', (err) => {
      if (err) return done(err);
      app.req.get('/').expect(helper.shouldSetCookie('use.sid')).expect(200, 'session 2', (err) => {
        if (err) return done(err);
        app.req.get('/').expect(helper.shouldSetCookie('use.sid')).expect(200, 'session 3', (err) => {
          if (err) return done(err);
          app.done();
          app.done();
          app.done();
        });
      });
    });
  });

  describe('when req.session is empty before write head', () => {
    it('should has session when not acess req.session', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid'))
        .expect(404, app.done);
    });

    it('should has session when get property on req.session', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        assert.equal(req.session.a, undefined);
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid'))
        .expect(404, app.done);
    });

    it('should create session when remove all properties on req.session', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        req.session.a = '1';
        delete req.session.a;
        assert.notEqual(req.session, null);
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid'))
        .expect(404, app.done);
    });

    it('should has session when set all properties undefined on req.session', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        req.session.a = '1';
        req.session.a = undefined;
        assert.notEqual(req.session, null);
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid'))
        .expect(404, app.done);
    });

    it('should has session when destroy req.session', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        req.session.a = '1';
        assert.notEqual(req.session, null);
        req.session.destroy();
        assert.equal(req.session.a, undefined);
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid'))
        .expect(404, app.done);
    });

    it('should has session when regenerate req.session', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        req.session.a = '1';
        assert.notEqual(req.session, null);
        req.session.regenerate();
        assert.equal(req.session.a, undefined);
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid'))
        .expect(404, app.done);
    });

    it('should has emtpy session when set req.session after resp.end', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        resp.end('hello');
        req.session.a = '1';
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid'))
        .expect(200, 'hello', app.done);
    });

    it('should has session when set req.session after resp.write', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        resp.write('hello');
        req.session.a = '1';
      });
      app.req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid'))
        .expect(200, 'hello', app.done);
    });

    it('should has session when set req.session after resp.writeHead', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp, next) => {
        resp.writeHead(200);
        req.session.a = '1';
      });
      app.req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid'))
        .expect(200, app.done);
    });
  });

  describe('when set req.session before and after write head', () => {
    it('should set cookie with resp.end', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp) => {
        if (req.url === '/') {
          req.session.a = '1';
          resp.end();
          req.session.b = 2;
        }
      });
      app.req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, (err) => {
        if (err) return app.done(err);
        const sess = helper.firstSession(app.store);
        assert.equal(sess.data.a, '1');
        assert.equal(sess.data.b, undefined);
        app.done();
      });
    });
    it('should set cookie with resp.write', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp) => {
        if (req.url === '/') {
          req.session.a = '1';
          resp.write('hello');
          req.session.b = 2;
        }
      });
      app.req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, (err) => {
        if (err) return app.done(err);
        const sess = helper.firstSession(app.store);
        assert.equal(sess.data.a, '1');
        assert.equal(sess.data.b, 2);
        app.done();
      });
    });
    it('should set cookie with resp.writeHead', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp) => {
        if (req.url === '/') {
          req.session.a = '1';
          resp.writeHead(200);
          req.session.b = 2;
        }
      });
      app.req.get('/').expect(helper.shouldHasSession(app.store, 'use.sid')).expect(200, (err) => {
        if (err) return app.done(err);
        const sess = helper.firstSession(app.store);
        assert.equal(sess.data.a, '1');
        assert.equal(sess.data.b, 2);
        app.done();
      });
    });
    it('should has empty session when destroy after write head', (done) => {
      const app = helper.createApp(done);
      app.use((req, resp) => {
        if (req.url === '/') {
          req.session.a = '1';
          resp.writeHead(200);
          req.session.a = undefined;
        }
      });
      app.req.get('/').expect(helper.shouldHasEmptySession(app.store, 'use.sid')).expect(200, (err) => {
        if (err) return app.done(err);
        app.done();
      });
    });
  });
});
