
const url = require('url');
const cookie = require('cookie');
const ms = require('ms');
const onHeaders = require('on-headers');
const debug = require('debug')('midd-session');
const util = require('./util');
const Session = require('./session');

module.exports = function createSessionMiddleware(options) {
  const secret = options.secret,
    store = options.store,
    name = options.name,
    cookieOptions = options.cookie;
  let ttl = options.ttl;
  if (typeof ttl === 'string') ttl = ms(ttl);

  return function sessionMiddleware(req, resp, next) {
    if (req.session) return next();

    // check cookie path
    const pathname = url.parse(req.url).pathname;
    const cookiepath = cookieOptions.path;
    if (pathname.slice(0, cookiepath.length) !== cookiepath) return next();

    return Session.load({ req, name, secret, store, ttl }).then(() => {
      // attach listener on resp.writeHead to set-cookie header
      onHeaders(resp, setCookie);
      let didSetCookie = false;
      function setCookie() {
        if (didSetCookie) return;
        didSetCookie = true;
        const session = req.session;

        if (session && session.isNew) {
          debug('set cookie header %s', session.id);

          // the session life is controlled by the server, not the client
          cookieOptions.maxAge = 2147483647;
          cookieOptions.expires = null;

          const sessId = util.sign(session.id, secret);

          const data = cookie.serialize(name, sessId, cookieOptions);
          const old = resp.getHeader('set-cookie') || [];
          resp.setHeader('set-cookie', (Array.isArray(old) ? old : [old]).concat(data));
        }
      }

      // proxy resp.end, so when called, commit the session
      const orgEnd = resp.end;
      resp.end = (...args) => {
        if (!req.__sessionCommitted) { // eslint-disable-line no-underscore-dangle
          req.__sessionCommitted = true;// eslint-disable-line no-underscore-dangle
          if (!resp.headersSent) setCookie();
          if (req.session) Session.commit(req.session);
        }

        orgEnd.call(resp, ...args);
      };

      return next();
    });
  };
};

