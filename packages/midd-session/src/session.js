
const cookie = require('cookie');
const util = require('./util');

function loadSession(options) {
  return new Promise((resolve, reject) => {
    const req = options.req,
      cookieName = options.name;
    let orgId;

    if (req.cookies) { // try cookieParse() result first
      orgId = req.cookies[cookieName];
    } else if (req.headers.cookie) {
      orgId = cookie.parse(req.headers.cookie)[cookieName];
    }
    if (orgId) {
      orgId = util.unsign(orgId, options.secret);
      options.store.get(orgId).then((data) => {
        if (data) {
          options.id = orgId;
          options.data = data;
        }
        const session = createSession(options);
        Object.defineProperty(req, 'session', { value: session, configurable: true });
        return resolve();
      }).catch(err => reject(err));
    } else {
      const session = createSession(options);
      Object.defineProperty(req, 'session', { value: session, configurable: true });
      return resolve();
    }
  });
}

function createSession(options) {
  const data = options.data || {};
  Object.defineProperties(data, {
    __orgHash: { value: util.hash(data) },
    __req: { value: options.req },
    __store: { value: options.store },
    __ttl: { value: options.ttl || 0 },
    id: { value: options.id || util.uid(24) },
    isNew: { value: !options.id },
    destroy: { value: destroySession },
    regenerate: { value: destroySession },
  });

  return data;
}

function destroySession() {
  let session = this;
  const req = session.__req, // eslint-disable-line no-underscore-dangle
    store = session.__store;// eslint-disable-line no-underscore-dangle
  if (!session.isNew) store.del(session.id);
  session = createSession({ data: null, id: null, req, store });
  Object.defineProperty(req, 'session', { value: session, configurable: true });
}

function commitSession(session) {
  if (!session) return;

  const store = session.__store, // eslint-disable-line no-underscore-dangle
    ttl = session.__ttl;// eslint-disable-line no-underscore-dangle

  // only when session created/modified/acessed, save or touch
  if (session.isNew) { // newly created session
    return store.set(session.id, session, ttl);
  } else { // change exist session
    if (session.__orgHash !== util.hash(session)) { // eslint-disable-line no-underscore-dangle
      return store.set(session.id, session, ttl);
    }

    // to touch
    if (ttl > 0) return store.touch(session.id, ttl);
  }
}

module.exports = {
  load: loadSession,
  commit: commitSession,
};
