
const assert = require('assert');
const fs = require('fs-extra');
const request = require('supertest');
const path = require('path');
const Server = require('midd');
const middSession = require('midd-session');
const FileStore = require('..');

beforeEach(() => {
  fs.mkdirpSync('sessions');
});
afterEach((done) => {
  fs.remove('sessions', done);
});
describe('file store', () => {
  it('should create one session file and touch it', (done) => {
    let count = 0;
    const store = new FileStore();
    const app = Server();
    app.use(middSession({ secret: 'file', store }));
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`${req.session.n}`);
    });
    const req = request.agent(app.listen());
    req.get('/').expect(200, '1', async (err) => {
      if (err) return done(err);
      assert.equal(store.length, 1);
      const sess = await fileSession();
      req.get('/').expect(200, '1', async (err) => {
        if (err) return done(err);
        await sleep(100);
        assert.equal(store.length, 1);
        const newSess = await fileSession();
        assert.equal(newSess.id, sess.id);
        assert.equal(newSess.ttl, sess.ttl);
        assert.equal(newSess.data.n, sess.data.n);
        assert.notEqual(newSess.start, sess.start);
        done();
      });
    });
  });
  it('should create multiple session file', (done) => {
    let count = 0;
    const store = new FileStore();
    const app = Server();
    app.use(middSession({ secret: 'file', store }));
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`${req.session.n}`);
    });
    const req = request(app.listen());
    req.get('/').expect(200, '1', (err) => {
      if (err) return done(err);
      assert.equal(store.length, 1);
      req.get('/').expect(200, '2', (err) => {
        if (err) return done(err);
        assert.equal(store.length, 2);
        done();
      });
    });
  });
  it('should destroy the session file', (done) => {
    const store = new FileStore();
    const app = Server();
    app.use(middSession({ secret: 'file', store }));
    app.use((req, resp, next) => {
      if (req.url === '/1') {
        req.session.n = 1;
      } else {
        req.session.destroy();
        req.session.n = 2;
      }
      resp.end(`${req.session.n}`);
    });
    const req = request.agent(app.listen());
    req.get('/1').expect(200, '1', async (err) => {
      if (err) return done(err);
      assert.equal(store.length, 1);
      await sleep(100);
      const sess = await fileSession();
      req.get('/2').expect(200, '2', async (err) => {
        if (err) return done(err);
        assert.equal(store.length, 1);
        await sleep(100);
        const newSess = await fileSession();
        assert.notEqual(newSess.id, sess.id);
        done();
      });
    });
  });
  it('should delete session property', (done) => {
    const store = new FileStore();
    const app = Server();
    app.use(middSession({ secret: 'file', store }));
    app.use((req, resp, next) => {
      if (req.url === '/1') {
        req.session.n = 1;
      } else {
        delete req.session.n;
        assert.equal(req.session.n, undefined);
      }
      resp.end(`${req.session.n}`);
    });
    const req = request.agent(app.listen());
    req.get('/1').expect(200, '1', async (err) => {
      if (err) return done(err);
      assert.equal(store.length, 1);
      await sleep(100);
      const sess = await fileSession();
      req.get('/2').expect(200, 'undefined', async (err) => {
        if (err) return done(err);
        assert.equal(store.length, 1);
        await sleep(100);
        const newSess = await fileSession();
        assert.equal(newSess.id, sess.id);
        assert.equal(newSess.data.n, undefined);
        done();
      });
    });
  });
  it('should clean the expired session', (done) => {
    const store = new FileStore({ cleanInterval: 20 });
    const app = Server();
    app.use(middSession({ secret: 'file', store, ttl: 20 }));
    app.use((req, resp, next) => {
      req.session.n = 1;
      resp.end(`${req.session.n}`);
    });
    const req = request.agent(app.listen());
    req.get('/1').expect(200, '1', (err) => {
      if (err) return done(err);
      assert.equal(store.length, 1);
      setTimeout(() => {
        assert.equal(store.length, 0);
        done();
      }, 60);
    });
  });
});

function fileSession() {
  const files = fs.readdirSync('sessions');
  let content = fs.readFileSync(`sessions/${files[0]}`, 'utf8');
  content = JSON.parse(content);
  content.id = path.basename(files[0], '.sess');
  return content;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
