
const fresh = require('fresh');
const getETag = require('etag');

function checkCacheFreshOnResp(req, resp) {
  if (!resp.send) return;

  const orgSend = resp.send.bind(resp);
  resp.send = (body) => {
    let etag = resp.getHeader('ETag');
    if (!etag) {
      etag = getETag(body);
      if (etag) {
        resp.setHeader('ETag', etag);
      }
    }

    const method = req.method;
    if (method !== 'GET' && method !== 'HEAD') return orgSend(body);

    const lastMod = resp.getHeader('Last-Modified');

    const isFresh = fresh(req.headers, { etag, 'last-modified': lastMod });// cache is fresh, no need to update
    if (isFresh) {
      resp.statusCode = 304;
      resp.removeHeader('Content-Length');
      resp.end();
      return;
    }

    return orgSend(body);
  };
}

module.exports = checkCacheFreshOnResp;
