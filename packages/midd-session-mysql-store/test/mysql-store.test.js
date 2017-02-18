
const assert = require('assert');
const mysql = require('mysql');
const request = require('supertest');
const Server = require('midd');
const middSession = require('midd-session');
const MysqlStore = require('..');
const { connProps, checkConnectError, skipOnConnectError } = require('./helper');

const storeOptions = {
  ...connProps,
  showError: true,
};
describe('midd-session-mysql-store: basic', function () {
  before(checkConnectError);
  afterEach((done) => {
    const db = mysql.createConnection(storeOptions);
    db.query('drop table sessions', done);
  });
  it('should create one session and touch it', async function () {
    skipOnConnectError(this);
    this.timeout(10000);

    let count = 0;
    const store = new MysqlStore(storeOptions);
    await sleep(100);

    const app = Server();
    app.use(middSession({ secret: 'mysql', store }));
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`${req.session.n}`);
    });

    const req = request.agent(app.listen());
    await reqExpect(req.get('/'), 200, '1');
    assert.equal(await store.length, 1);
    const sess = await mysqlSession();

    await reqExpect(req.get('/'), 200, '1');

    await sleep(100);
    assert.equal(await store.length, 1);
    const newSess = await mysqlSession();

    assert.equal(newSess.id, sess.id);
    assert.equal(newSess.ttl, sess.ttl);
    assert.equal(newSess.data.n, sess.data.n);
    assert.notEqual(newSess.accessed, sess.accessed);
  });
  it('should create multiple session mysql', async function () {
    skipOnConnectError(this);

    let count = 0;
    const store = new MysqlStore(storeOptions);
    await sleep(100);

    const app = Server();
    app.use(middSession({ secret: 'mysql', store }));
    app.use((req, resp, next) => {
      req.session.n = req.session.n || ++count;
      resp.end(`${req.session.n}`);
    });
    const req = request(app.listen());

    await reqExpect(req.get('/'), 200, '1');
    assert.equal(await store.length, 1);
    await reqExpect(req.get('/'), 200, '2');
    assert.equal(await store.length, 2);
  });
  it('should destroy the session mysql', async function () {
    skipOnConnectError(this);

    const store = new MysqlStore(storeOptions);
    await sleep(100);

    const app = Server();
    app.use(middSession({ secret: 'mysql', store }));
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

    await reqExpect(req.get('/1'), 200, '1');
    assert.equal(await store.length, 1);
    await sleep(100);
    const sess = await mysqlSession();

    await reqExpect(req.get('/2'), 200, '2');
    assert.equal(await store.length, 1);
    await sleep(100);
    const newSess = await mysqlSession();

    assert.notEqual(newSess.id, sess.id);
  });

  it('should delete session property', async function () {
    skipOnConnectError(this);

    const store = new MysqlStore(storeOptions);
    await sleep(100);

    const app = Server();
    app.use(middSession({ secret: 'mysql', store }));
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

    await reqExpect(req.get('/1'), 200, '1');
    assert.equal(await store.length, 1);
    await sleep(100);
    const sess = await mysqlSession();

    reqExpect(req.get('/2'), 200, 'undefined');
    assert.equal(await store.length, 1);
    await sleep(100);
    const newSess = await mysqlSession();

    assert.equal(newSess.id, sess.id);
    assert.equal(newSess.data.n, undefined);
  });
});

function reqExpect(req, status, body) {
  return new Promise((resolve, reject) => req.expect(status, body, (err, resp) => {
    if (err) return reject(err);
    return resolve(resp);
  }));
}

function mysqlSession() {
  return new Promise((resolve, reject) => {
    const db = mysql.createConnection(storeOptions);
    db.query('select * from sessions', (err, result) => {
      if (err) return reject(err);
      if (result && result.length > 0) {
        const record = result[0];
        record.data = JSON.parse(record.data);
        return resolve(record);
      }
      return resolve(null);
    });
  });
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
