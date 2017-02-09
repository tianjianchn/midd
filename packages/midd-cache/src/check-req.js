
const fresh = require('fresh');

function checkCacheFreshOnReq(req, resp, status) {
  const method = req.method;
  if (method !== 'GET' && method !== 'HEAD') {
    return false;
  }

  // parse status
  const parsedStatus = {};
  if (status) {
    for (const kk in status) {
      const pk = kk.toLowerCase();
      let vv = status[kk];
      if (!vv) continue;

      if (pk === 'last-modified' || pk === 'lastmodified') {
        if (typeof vv === 'number') vv = new Date(vv).toUTCString();
        else if (vv instanceof Date) vv = new Date(vv.getTime()).toUTCString();
        parsedStatus[pk] = vv;
      } else if (pk === 'etag') parsedStatus[pk] = vv;
    }
  }

  const isFresh = fresh(req.headers, parsedStatus);
  if (isFresh) { // cache is fresh, no need to update
    resp.statusCode = 304;
    resp.end();
    return true;
  }

  return false;
}

module.exports = checkCacheFreshOnReq;
