
const debug = require('debug')('midd-session');
const ms = require('ms');
const path = require('path');
const fs = require('fs');
const readdir = a2p(fs.readdir),
  readFile = a2p(fs.readFile),
  unlink = a2p(fs.unlink),
  writeFile = a2p(fs.writeFile);

const defaults = {
  cleanInterval: ms('1h'),
  dir: 'sessions',
  showError: false,
};
function FileStore(options) {
  options || (options = {});
  options.cleanInterval || (options.cleanInterval = defaults.cleanInterval);
  options.dir || (options.dir = defaults.dir);
  this._dir = path.resolve(options.dir);
  fs.lstatSync(this._dir);// check dir exists
  this._showError = !!options.showError;

  let interval = options.cleanInterval;
  if (interval !== false) {
    if (typeof interval === 'string') interval = ms(interval);
    debug('auto clean expired file session with interval of %s ms', interval);
    const itv = setInterval(clean.bind(this), interval);
    itv.unref();
  }
}

function clean() {
  const dir = this._dir;
  readdir(dir).then(files => Promise.all(files.map((file) => {
    const filePath = path.join(dir, file);
    return readFile(filePath, 'utf8').then((content) => {
      if (!content) return unlink(filePath);
      const session = JSON.parse(content);
      if (session.start && Date.now() > (session.start + session.ttl)) {
        return unlink(filePath);
      }
      return null;
    });
  }))).catch((e) => {
    this._showError && console.error('error to clean the expired file session: %s', e.message);// eslint-disable-line no-console
  });
}

const proto = FileStore.prototype;
proto.get = function get(id) {
  return readFile(path.join(this._dir, id), 'utf8').then((content) => {
    if (!content) return null;
    const session = JSON.parse(content);
    if (session.start && Date.now() > (session.start + session.ttl)) {
      return unlink(path.join(this._dir, id)).catch((e) => {}).then(() => {
        debug('file session %s expired, destroyed', id);
        return null;
      });
    }
    return session.data;
  }).catch((e) => {
    this._showError && console.error('error to get file sessoin: %s %s', id, e.message);
    return null;
  });
};

proto.set = function set(id, data, ttl) {
  const session = { data };
  if (ttl > 0) {
    session.start = Date.now();
    session.ttl = ttl;
  }
  return writeFile(path.join(this._dir, id), JSON.stringify(session)).catch((e) => {
    this._showError && console.error('error to save file sessoin: %s %s', id, e.message);
  }).then(() => debug('save file session %s', id));
};

proto.del = function del(id) {
  return unlink(path.join(this._dir, id)).catch((e) => {
    this._showError && console.error('error to destroy the file sessoin: %s %s', id, e.message);
  }).then(() => debug('destroy file session %s', id));
};

proto.touch = function touch(id) {
  return readFile(path.join(this._dir, id), 'utf8').then((content) => {
    if (!content) return;
    const session = JSON.parse(content);
    if (!session.start) return;
    session.start = Date.now();
    return writeFile(path.join(this._dir, id), JSON.stringify(session));
  }).catch((e) => {
    this._showError && console.error('error to touch the file sessoin: %s %s', id, e.message);
  }).then(() => debug('touch file session %s', id));
};

function a2p(fn, _this) {
  return (...args) =>
    // const args = Array.prototype.map.call(arguments, arg => arg);
    new Promise((resolve, reject) => {
      args.push((err, data) => {
        if (err) return reject(err);
        else return resolve(data);
      });
      fn.apply(_this, args);
    });
}

// helper for test
Object.defineProperty(proto, 'length', { get() {
  return fs.readdirSync(this._dir).length;
} });

module.exports = FileStore;
