
/**
 * Compose multiple middlewares(functions) to one.
 * A middleware is a function with characterisitic of `(a, b, next)`.
 * Calling `next` function to invoke next middleware. `next()` will return next
 * milddware's return which will be always wrapped in the Promise.
 */

function compose(middlewares, options = {}) {
  const { beforeRunMiddleware } = options;// before invoking the middleware, check whether can be run

  // all middleware should be function
  if (!Array.isArray(middlewares)) middlewares = [middlewares];
  for (const mw of middlewares) {
    if (typeof mw !== 'function') throw new TypeError('middleware should be a function');
  }

  return function ComposedMiddleware(req, resp, next) {
    let doRunMiddleware;

    let lastIndex = -1;// last run middleware index
    const runMiddleware = (index) => {
      if (lastIndex >= index) {
        return Promise.reject(new Error('next() called multiple times'));
      }
      lastIndex = index;

      const middleware = middlewares[index];
      if (middleware && beforeRunMiddleware) {
        return Promise.resolve(beforeRunMiddleware(middleware, req, resp)).then((canRun) => {
          if (!canRun) return runMiddleware(index + 1);
          else return doRunMiddleware(index);
        });
      }

      return doRunMiddleware(index);
    };

    doRunMiddleware = (index) => {
      let middleware = middlewares[index];
      const nextIndex = index + 1;

      let runNextMiddleware = noop;
      if (!middleware) {
        if (next) middleware = next;
      } else if (middlewares[nextIndex] || next) {
        runNextMiddleware = () => runMiddleware(nextIndex);
      }

      try {
        let result;
        if (middleware) result = middleware.call(this, req, resp, runNextMiddleware);
        return Promise.resolve(result);
      } catch (e) {
        return Promise.reject(e);
      }
    };

    return runMiddleware(0);
  };
}

function noop() {

}

module.exports = compose;
