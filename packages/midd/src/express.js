
const middRouter = require('midd-router');

const VERBS = [...middRouter.VERBS, 'use', 'all'];

module.exports = function bindExpress(app) {
  const express = { Router: middRouter };

  for (const verb of VERBS) {
    express[verb] = (...args) => {
      const router = middRouter();
      router.express[verb](...args);
      app.use(router);
    };
  }

  app.express = express;
};

