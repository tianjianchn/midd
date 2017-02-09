
const url = require('url');

module.exports = function createUrlMiddleware() {
  return (req, resp, next) => {
    const obj = url.parse(req.url, true);

    obj.host || (obj.host = req.headers.host || '');
    obj.hostname || (obj.hostname = obj.host.split(':')[0]);
    obj.port || (obj.port = +(obj.host.split(':')[1]));

    if (!obj.protocol) {
      if ((req.socket && req.socket.encrypted) || (req.connection && req.connection.encrypted)) {
        obj.protocol = 'https:';
      } else {
        obj.protocol = 'http:';
      }
    }

    for (const key in obj) {
      if (key === 'slashes' || key === 'hash') continue;
      req[key] = obj[key];
    }

    return next();
  };
};
