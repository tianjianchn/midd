
const assert = require('assert');
const Server = require('midd');
const session = require('..');

describe('session(options)', () => {
  it('should throw without secret option', (done) => {
    const app = Server();
    assert.throws(() => {
      app.use(session({ secret: undefined }));
    }, /required\ssecret.*/);
    assert.throws(() => {
      app.use(session());
    }, /required\ssecret.*/);
    done();
  });
});
