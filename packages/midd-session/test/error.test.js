
const assert = require('assert');
const request = require('supertest');
const Server = require('midd');
const when = require('after');
const session = require('..');
const helper = require('./helper');

describe('session error handle', () => {
  it('should catch the store.get error', (done) => {
    const cb = when(2, done);
    const store = new session.MemoryStore();
    store.get = () => Promise.reject(new Error('get error'));

    const app = Server();
    app.on('error', (err) => {
      assert.equal(err.message, 'get error');
      cb();
    });
    app.use(session({ secret: 'any', store }));
    app.use((req, resp, next) => {
      req.session.a = 'b';// will throw on second req
    });
    const req = request.agent(app.listen());
    req.get('/').expect(helper.shouldSetCookie('use.sid')).expect(404, (err) => {
      if (err) return cb(err);
      setTimeout(() => {
        req.get('/').expect(500, cb);
      });
    });
  });
});
