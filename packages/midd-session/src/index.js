
const ms = require('ms');
const MemoryStore = require('./memory-store');
const util = require('./util');
const createSessionMw = require('./create-mw');

const defaultConf = {
  cookie: { path: '/', httpOnly: true, secure: false }, // no expire for cookie(Max-Age always null)
  ttl: ms('15m'), // session timeout on server side, not for cookie
  name: 'use.sid',
  secret: '',
  store: null,
};

function sessionMwFactory(options) {
  options || (options = {});
  options.cookie || (options.cookie = {});
  util.defaults(options.cookie, defaultConf.cookie);
  util.defaults(options, defaultConf);
  options.store || (options.store = new MemoryStore());
  options.cookie.maxAge = 0;

  if (!options.secret) {
    throw new Error('required secret option in session');
  }

  return createSessionMw(options);
}

module.exports = sessionMwFactory;
module.exports.MemoryStore = MemoryStore;
