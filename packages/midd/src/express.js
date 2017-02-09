const Router = require('midd-router');

module.exports = (app) => {
  const router = Router();
  app.use(router);

  router.Router = Router;

  app.express = router;
};
