
module.exports = function Header() {
  return (req, resp, next) => {
    req.get = get;
    resp.set = set;
    return next();
  };
};

function get(key) {
  return this.headers[key.toLowerCase()];
}

function set(key, value) {
  if (typeof key === 'string') {
    this.setHeader(key, value);
  } else {
    for (const kk in key) {
      this.setHeader(kk, key[kk]);
    }
  }
}

