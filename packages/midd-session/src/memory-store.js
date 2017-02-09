
const ms = require('ms');
const debug = require('debug')('use-session');
const util = require('./util');

const msDefaults = {
  interval: '1h',
};
function MemoryStore(options) {
  const sessions = this._sessions = {};

  options || (options = {});
  util.defaults(options, msDefaults);
  let interval = options.interval;
  if (typeof interval === 'string') interval = ms(interval);
  debug('auto clean expired session with interval of %s ms', interval);

  // auto clean expired session
  const itv = setInterval(() => {
    const now = Date.now();
    Object.keys(sessions).forEach((id) => {
      const sess = sessions[id];
      if (!sess || (sess.start && sess.start + sess.ttl < now)) {
        debug('destroy expired session %s', id);
        delete sessions[id];
      }
    });
  }, interval);
  itv.unref();
}
const proto = MemoryStore.prototype;

proto.get = function get(id) {
  return new Promise((resolve, reject) => {
    let sess = this._sessions[id];
    if (!sess) {
      debug('miss session %s', id);
      return resolve(null);
    }
    sess = JSON.parse(sess);
    if (sess.start && Date.now() > (sess.start + sess.ttl)) {
      debug('session %s expired, destroyed', id);
      this._sessions[id] = undefined;
      return resolve(null);
    }
    return resolve(sess.data);
  });
};

proto.set = function set(id, data, ttl) {
  const now = new Date();
  const sess = { data };
  if (ttl > 0) {
    sess.start = now.getTime();
    sess.ttl = ttl;
  }
  this._sessions[id] = JSON.stringify(sess);
  debug('save session %s', id);
};

proto.del = function del(id) {
  if (this._sessions[id]) this._sessions[id] = undefined;
  debug('destroy session %s', id);
};

proto.touch = function touch(id) {
  let sess = this._sessions[id];
  if (!sess) return;
  sess = JSON.parse(sess);
  if (!sess.start) return;
  sess.start = Date.now();
  this._sessions[id] = JSON.stringify(sess);
  debug('touch session %s', id);
};

// helper for test
Object.defineProperty(proto, 'length', { get() {
  let count = 0;
  for (const ii in this._sessions) {
    if (!this._sessions[ii]) continue;
    count += 1;
  }
  return count;
} });

module.exports = MemoryStore;
