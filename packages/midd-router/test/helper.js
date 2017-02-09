

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function end404(req, resp) {
  resp.statusCode = 404;
  resp.end('');
}

function when(times, cb) {
  let called = 0,
    error;
  return (err) => {
    if (err) error = err;
    called += 1;
    if (called >= times) return cb(error);
  };
}

module.exports = {
  sleep, end404, when,
};
