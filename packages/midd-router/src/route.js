
/**
 * A route is a middleware(function) which attach with a path pattern in router.
 * Each route can be composed by many middlewares. The middleware can be a simple
 * plain function or an another router.
 */

const ptre = require('path-to-regexp');
const compose = require('midd-compose');

/**
 * method: match http verb. true matching all verbs
 * end: url match mode, true for exact match, false for prefix match. like:
 *  end=true: req.url '/a/b' will not match pattern '/a'
 */
function addRouteFactory(router, method, end) {
  return (pattern, ...middlewares) => {
    if (typeof pattern === 'function') {
      middlewares = [pattern, ...middlewares];
      pattern = '/';
    }

    // create a route with multiple middlewares
    const route = compose(middlewares, { beforeRunMiddleware: (middleware, req, resp) => {
      const len = req.routePath ? req.routePath.length : 0;
      if (req.url.slice(0, len) !== req.routePath) return false;// url changed
      return true;
    } });
    route.method = method;

    const keys = [];
    const re = ptre(pattern, keys, { end, strict: false, sensitive: false });
    route.re = re;// used to test the remain of req.url
    route.keys = keys;

    router.routes.push(route);

    return router;
  };
}

function matchRoute(routerPath, req, route) {
  // restrict the request method
  if (route.method !== true && route.method !== req.method) return false;

  // Detect url changed in previous route. If not match the router routePath,
  // ignore this route.
  const routerPathLen = routerPath.length;
  if (req.url.slice(0, routerPathLen) !== routerPath) return false;// url changed
  const relative = req.url.slice(routerPathLen);

  // path pattern match
  const match = route.re.exec(relative);
  if (!match) return false;

  // extract the req.params
  const params = {};
  const len = route.keys.length;
  for (let kk = 0; kk < len; ++kk) {
    const key = route.keys[kk],
      value = match[kk + 1];
    if (typeof value === 'undefined') continue;
    params[key.name] = value;
  }

  return { params, path: match[0] };
}

module.exports = {
  addRouteFactory, matchRoute,
};
