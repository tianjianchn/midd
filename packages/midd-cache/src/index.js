
const checkCacheFreshOnReq = require('./check-req');
const checkCacheFreshOnResp = require('./check-resp');
const setCache = require('./set-cache');

module.exports = function Cache() {
  return (req, resp, next) => {
    req.fresh = checkCacheFreshOnReq.bind(null, req, resp);
    checkCacheFreshOnResp(req, resp);// working only for resp.send() method(after `midd-send` middleware)
    resp.setCache = setCache;

    return next();
  };
};

