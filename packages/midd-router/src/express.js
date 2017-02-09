
const wrapExpressMiddleware = require('midd-express-middlewares');

const VERBS = require('./verbs');

function bindVerb(router, verb) {
  return (pattern, ...middlewares) => {
    if (typeof pattern === 'function') {
      middlewares = [pattern, ...middlewares];
      pattern = '/';
    }
    for (const middleware of middlewares) router[verb](pattern, wrapExpressMiddleware(middleware));
  };
}

module.exports = function bindExpressVerbs(router) {
  const express = {
    use: bindVerb(router, 'use'),
    all: bindVerb(router, 'all'),
  };
  VERBS.forEach((verb) => {
    express[verb] = bindVerb(router, verb);
  });

  router.express = express;
};
