
/**
 * A router is a middleware(function) which has many routes.
 *
 * `req.routePath` represents current router/route's context(or position).
 * See there are router A and router B, and their relations are described by
 * `routerA.use('/a', routerB). So (router B's routePath) = (router A's routePath) + '/a'.
 * Why set the routePath on req dynamically? for the path pattern may be regexp.
 */

const compose = require('midd-compose');
const VERBS = require('./verbs');
const { addRouteFactory, matchRoute } = require('./route');
const bindExpressVerbs = require('./express');

function createRouter(options = {}) {
  router.routes = [];

  // the router instance
  function router(req, resp, next) {
    const routerPath = req.routePath || '';

    const beforeRunMiddleware = (route) => {
      const match = matchRoute(routerPath, req, route);
      if (!match) return false;

      const { params, path: matchPath } = match;

      if (options.params) req.params = { ...options.params, ...params };
      else req.params = params;

      // dynamically set req.routePath for the route
      req.routePath = routerPath + matchPath;
      return true;
    };
    const routeStack = compose(router.routes, { beforeRunMiddleware });

    return routeStack.call(this, req, resp, () => {
      req.routePath = routerPath;// restore routePath
      return next && next();
    });
  }

  // use('/a') will match /a, /a/b
  router.use = addRouteFactory(router, true, false);

  // all|get|post('/a') will only match /a, not match /a/b
  router.all = addRouteFactory(router, true, true);
  VERBS.forEach((verb) => {
    router[verb] = addRouteFactory(router, verb.toUpperCase(), true);
  });

  bindExpressVerbs(router);

  return router;
}

module.exports = createRouter;
