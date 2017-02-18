
const Router = require('uni-router');
const bindExpressVerbs = require('./express');

function createMiddRouterMiddleware(...args) {
  const router = Router(...args);
  bindExpressVerbs(router);
  return router;
}

createMiddRouterMiddleware.VERBS = Router.VERBS;

module.exports = createMiddRouterMiddleware;
