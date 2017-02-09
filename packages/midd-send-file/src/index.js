
const send = require('send');

module.exports = function sendFile(req, resp, filePath, options = {}) {
  const { setHeaders, headers } = options;
  return new Promise((resolve, reject) => {
    // create `send` stream
    const stream = send(req, filePath, options);

    if (setHeaders) stream.on('headers', setHeaders);
    else if (headers) {
      stream.on('headers', (res, path, stat) => {
        for (const kk in headers) {
          res.setHeader(kk, headers[kk]);
        }
      });
    }

    stream.on('error', reject);
    stream.on('end', resolve);

    stream.pipe(resp);
  });
};
