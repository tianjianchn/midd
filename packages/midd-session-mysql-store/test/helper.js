
const mysql = require('mysql');

const connProps = {
  database: 'test',
  user: 'test',
  password: 'test',
};

let connError = null;
function checkConnectError(done) {
  const db = mysql.createConnection(connProps);
  db.query('select 1', (err) => {
    if (err) {
      connError = err;
      return done();
    }
    return done();
  });
}

function skipOnConnectError(target) {
  if (connError) {
    console.warn(`Will skip for ${connError.message}`);
    target.skip();
  }
}

module.exports = {
  connProps, checkConnectError, skipOnConnectError,
};
