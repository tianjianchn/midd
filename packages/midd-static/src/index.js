
const url = require('url');
const sendFile = require('midd-send-file');

// options: {root: ,maxAge: ,fallthrough: true|false,index: }
module.exports = function createStaticMiddleware(rootDir, options) {
  if (typeof rootDir !== 'string') {
    options = rootDir || {};
  } else {
    options || (options = {});
    options.root = rootDir;
  }

  // setup options for send
  if (!options.root) options.root = process.cwd();
  options.maxAge = options.maxAge || 0;

  return function staticMiddleware(req, resp, next) {
    if (req.method !== 'GET' && req.method !== 'HEAD') { // only for GET/HEAD
      resp.statusCode = 405;
      resp.setHeader('Allow', 'GET, HEAD');
      resp.setHeader('Content-Length', '0');
      return resp.end();
    }

    // req.relative: to take care of the router, see `use-router`
    let pathname;
    if (!req.routePath || req.routePath === '/') {
      pathname = url.parse(req.url).pathname;
    } else {
      pathname = req.url.slice(req.routePath.length);
    }
    return sendFile(req, resp, pathname, options).catch((e) => {
      if (options.fallthrough) return next();

      resp.statusCode = 404;
      resp.end('Not Found');
    });
  };
};
