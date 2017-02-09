
const crypto = require('crypto');
const debug = require('debug')('use-session');

function escapeStr(str) {
  return str.replace(/[^\w]+/g, '');
}
exports.escapeStr = escapeStr;

function sign(str, secret) {
  return `${str}.${escapeStr(crypto.createHmac('sha256', secret).update(str).digest('base64'))}`;
}
exports.sign = sign;

function unsign(val, secret) {
  const str = val.slice(0, val.indexOf('.'));
  const sval = sign(str, secret);
  if (sval === val) {
    debug('cookie unsigned');
    return str;
  } else {
    debug('invalid cookie signature');
  }
}
exports.unsign = unsign;

function uid(len) {
  return escapeStr(crypto.randomBytes(len).toString('base64'));
}
exports.uid = uid;

function hash(obj) {
  return JSON.stringify(obj);
}
exports.hash = hash;

const emptyHash = hash({});
function isEmpty(session) {
  return hash(session) === emptyHash;
}
exports.isEmpty = isEmpty;

function defaults(obj, def) {
  for (const kk in def) {
    if (typeof obj[kk] === 'undefined') {
      obj[kk] = def[kk];
    }
  }
  return obj;
}
exports.defaults = defaults;
