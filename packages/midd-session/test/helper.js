/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off, no-plusplus:off */


const assert = require('assert');
const request = require('supertest');
const when = require('after');
const Server = require('midd');
const session = require('..');

function createApp(options, done) {
  if (typeof options === 'function') {
    done = options;
    options = {};
  }
  options || (options = {});
  options = { secret: `any${(`${Math.random()}.0`).slice(2, 3)}`, store: new session.MemoryStore(), ...options };

  const app = Server();
  app.use(session(options));
  const server = app.listen();
  app.server = server;
  app.store = options.store;

  const req = request(app.server);
  const agent = request.agent(app.server);
  let pending = 0;
  Object.defineProperties(app, {
    req: { get() {
      pending++;
      return req;
    } },
  });
  app.done = function (err) {
    if (err) return done(err);
    pending -= 1;
    if (!pending) done();
  };
  return app;
}

function firstSession(store) {
  const sessions = store._sessions;// eslint-disable-line no-underscore-dangle
  const id = Object.keys(sessions)[0];
  let sess = sessions[id];
  sess = JSON.parse(sess);
  sess.id = id;
  return sess;
}

function cookies(resp) {
  if (resp.__cookieInited) return;// eslint-disable-line no-underscore-dangle
  resp.__cookieInited = true;// eslint-disable-line no-underscore-dangle

  const header = resp.headers['set-cookie'];
  if (!header) resp.cookies = null;
  else {
    resp.cookies = [];
    for (const ii in header) {
      const coo = header[ii];
      const parts = coo.split('; ');
      const one = {};
      for (const jj in parts) {
        const kv = parts[jj].split('=');
        one[kv[0]] = kv[1] || (kv.length === 1 ? true : kv[1]);
      }
      resp.cookies.push(one);
    }
  }
}

/* eslint no-unused-vars:0*/
function shouldSetCookies() {
  if (arguments.length !== 0) throw new Error('wrong usage');
  return function (resp) {
    cookies(resp);
    assert.notEqual(resp.cookies, null);
  };
}

function shouldNotSetCookies() {
  if (arguments.length !== 0) throw new Error('wrong usage');
  return function (resp) {
    cookies(resp);
    assert.equal(resp.cookies, null);
  };
}

function getCookie(resp, name, path) {
  cookies(resp);
  let cookieId = false;
  if (resp.cookies) {
    for (const ii in resp.cookies) {
      const cookie = resp.cookies[ii];
      if (cookie[name]) {
        assert.equal(cookie[name].split('.').length, 2);
        assert.equal(cookie['Max-Age'], 2147483647);
        assert.equal(cookie.Expires, undefined);
        assert.equal(cookie.Path, path || '/');
        assert.equal(cookie.HttpOnly, true);
        cookieId = cookie[name];
        break;
      }
    }
  }
  return cookieId;
}

function shouldSetCookie(name, path) {
  if (typeof name !== 'string') throw new Error('wrong usage');
  return function (resp) {
    assert(!!getCookie(resp, name, path));
  };
}

function shouldNotSetCookie(name) {
  if (typeof name !== 'string') throw new Error('wrong usage');
  return function (resp) {
    assert(!getCookie(resp, name));
  };
}

function shouldHasSession(store, name, path) {
  if (arguments.length < 2 || typeof name !== 'string' || !store.get) throw new Error('wrong usage');
  return async function (resp) {
    let cookieId = getCookie(resp, name, path);
    assert(!!cookieId);
    resp.cookieId = cookieId;
    cookieId = cookieId.split('.')[0];
    assert.equal(store.length, 1);
    assert(!!(await store.get(cookieId)));
  };
}

function shouldHasEmptySession(store, name, path) {
  if (arguments.length < 2 || typeof name !== 'string' || !store.get) throw new Error('wrong usage');
  return async function (resp) {
    let cookieId = getCookie(resp, name, path);
    assert(!!cookieId);
    resp.cookieId = cookieId;
    cookieId = cookieId.split('.')[0];
    assert.equal(store.length, 1);
    const sess = await store.get(cookieId);
    assert(!!sess);
    assert.deepEqual(sess, {});
  };
}

function shouldHasNonEmptySession(store, name, path) {
  if (arguments.length < 2 || typeof name !== 'string' || !store.get) throw new Error('wrong usage');
  return async function (resp) {
    let cookieId = getCookie(resp, name, path);
    assert(!!cookieId);
    resp.cookieId = cookieId;
    cookieId = cookieId.split('.')[0];
    assert.equal(store.length, 1);
    const sess = await store.get(cookieId);
    assert(!!sess);
    assert.notDeepEqual(sess, {});
  };
}

// no session in server but has cookei in client
function shouldNotHasServerSession(store, name, path) {
  if (arguments.length !== 2 || typeof name !== 'string' || !store.get) throw new Error('wrong usage');
  return function (resp) {
    const cookieId = getCookie(resp, name, path);
    assert(!!cookieId);
    assert.equal(store.length, 0);
  };
}

function shouldEqualStoreLength(store, length) {
  if (arguments.length !== 2 || typeof length !== 'number' || !store.get) throw new Error('wrong usage');
  return function (resp) {
    assert.equal(store.length, length);
  };
}

module.exports = {
  createApp,
  firstSession,
  cookies,
  shouldSetCookies,
  shouldNotSetCookies,
  getCookie,
  shouldSetCookie,
  shouldNotSetCookie,
  shouldHasSession,
  shouldNotHasServerSession,
  shouldEqualStoreLength,
  shouldHasEmptySession,
  shouldHasNonEmptySession,
};

