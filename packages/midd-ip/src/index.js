
module.exports = function IpMiddleware(proxy) {
  return (req, resp, next) => {
    let ips;
    if (proxy) {
      const xff = req.headers['x-forwarded-for'];
      ips = xff && xff.split(/\s*,\s*/);
    }
    if (!ips || ips.length <= 0) {
      ips = [req.socket.remoteAddress];
    }

    req.ips = ips;
    req.ip = ips[0];

    return next();
  };
};
