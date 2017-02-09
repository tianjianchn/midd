

module.exports = function wrapExpressMiddleware(middleware) {
  return function WrappedExpressMiddleware(req, resp, next) {
    return new Promise((resolve, reject) => {
      middleware(req, resp, (err) => {
        // called next() in express middleware
        if (err) return reject(err);
        return resolve(next && next());
      });

      // not called next() in express middleware, then wait the response end
      resp.on('finish', resolve);
      resp.on('close', resolve);
      resp.on('error', reject);
    });
  };
};
