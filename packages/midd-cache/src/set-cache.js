
const { format } = require('util');

const maxMaxAge = 31536000000;// one year

function setCache(options = {}) {
  const resp = this;

  let maxAge,
    isPrivate,
    lastMod,
    etag;

  for (let kk in options) {
    const vv = options[kk];
    if (kk === 'maxAge') maxAge = vv;
    else if (kk === 'private') isPrivate = !!vv;
    else {
      kk = kk.toLowerCase();
      if (kk === 'last-modified' || kk === 'lastmodified') lastMod = vv;
      else if (kk === 'etag') etag = vv;
    }
  }
  if (!lastMod && !etag) return;

  if (typeof maxAge !== 'number') maxAge = parseInt(maxAge, 10) || 0;
  if (maxAge >= 0) maxAge = Math.min(maxAge, maxMaxAge);
  else maxAge = maxMaxAge;// <0
  maxAge = parseInt(maxAge / 1000, 10) || 0;

  if (lastMod) {
    if (typeof lastMod === 'number') {
      lastMod = new Date(lastMod).toUTCString();
    } else if (lastMod instanceof Date) {
      lastMod = lastMod.toUTCString();
    } else lastMod || (lastMod = new Date().toUTCString());
  }

  const cacheCtrl = format('%s, max-age=%s', isPrivate ? 'private' : 'public', maxAge);
  resp.setHeader('Cache-Control', cacheCtrl);
  if (lastMod) resp.setHeader('Last-Modified', lastMod);
  if (etag) resp.setHeader('ETag', etag);
}

module.exports = setCache;

