/* eslint-env mocha*/
/* eslint prefer-arrow-callback:off, func-names:off, import/no-unresolved:off, import/no-extraneous-dependencies:off, no-plusplus:off */


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
