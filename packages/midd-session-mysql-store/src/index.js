

const debug = require('debug')('midd-session');
const mysql = require('mysql');
const util = require('util');

const defaults = {
  showError: false,
  host: '127.0.0.1',
  port: 3306,
  database: '',
  user: '',
  password: '',
  charset: 'utf8mb4',
  table: 'sessions',
};
function MysqlStore(options) {
  options || (options = {});
  this.options = Object.assign({}, defaults, options);

  const table = this.options.table;
  this.options.table = mysql.escapeId(table);

  const db = mysql.createPool(this.options);
  this._query = sql => new Promise((resolve, reject) => {
    db.query(sql, (err, result) => {
      if (err) return reject(err);
      else return resolve(result);
    });
  });

  this.options.independentProperties || (this.options.independentProperties = {});
  Object.keys(this.options.independentProperties).forEach((propName) => {
    let prop = this.options.independentProperties[propName];
    if (typeof prop === 'string') this.options.independentProperties[propName] = prop = { type: prop };
    prop.column || (prop.column = dbName(propName));
  });

  this._query(`show tables like '${table}'`).then((result) => {
    if (result.length > 0) return;
    let sql = 'CREATE TABLE %s (\n  %s,\n  PRIMARY KEY (`id`)\n);';

    const columns = [
      `${mysql.escapeId('id')} VARCHAR(64) NOT NULL`,
      `${mysql.escapeId('accessed')} bigint(20) NOT NULL`,
      `${mysql.escapeId('ttl')} int(11) default 0`,
      `${mysql.escapeId('data')} varchar(3000) NOT NULL`,
    ];

    Object.keys(this.options.independentProperties).forEach((propName) => {
      const prop = this.options.independentProperties[propName];
      columns.push(`${prop.column} ${prop.type}`);
    });

    sql = util.format(sql, this.options.table, columns.join(',\n  '));
    return this._query(sql).then(() => debug(`auto generated the table ${options.table}`));
  }).catch((e) => {
    console.warn(`Check the table ${options.table} failed: ${e.message}`);
  });
}

const proto = MysqlStore.prototype;
proto.get = function get(id) {
  return this._query(`select data,accessed,ttl from ${this.options.table} where id=${mysql.escape(id)};`)
  .then((rows) => {
    if (!rows || rows.length <= 0) return null;
    const data = rows[0].data,
      accessed = rows[0].accessed,
      ttl = rows[0].ttl;
    if (accessed && ttl > 0 && Date.now() > (accessed + ttl)) {
      debug('mysql session %s expired, destroyed', id);
      this.del(id);
      return null;
    }
    if (data) return JSON.parse(data);
    return {};
  }).catch((e) => {
    this.options.showError && console.error('error to get mysql session: %s %s', id, e.message);
    return null;
  });
};

proto.set = function set(id, data, ttl) {
  data || (data = {});
  const record = { id, data: JSON.stringify(data), ttl, accessed: Date.now() };

  Object.keys(this.options.independentProperties).forEach((propName) => {
    const columnName = this.options.independentProperties[propName].column;
    record[columnName] = typeof data[propName] === 'undefined' ? null : data[propName];
  });

  return this._query(`INSERT INTO ${this.options.table} set ${mysql.escape(record)} ON DUPLICATE KEY UPDATE ${mysql.escape(record)};`)
  .then(result => debug('save mysql session %s', id)).catch((e) => {
    this.options.showError && console.error('error to save mysql session: %s %s', id, e.message);
  });
};

proto.del = function del(id) {
  return this._query(`delete from ${this.options.table} where id=${mysql.escape(id)};`)
  .then(result => debug('destroy mysql session %s', id)).catch((e) => {
    this.options.showError && console.error('error to destroy mysql session: %s %s', id, e.message);
  });
};

proto.touch = function touch(id) {
  const set = { accessed: Date.now() },
    where = { id };
  return this._query(`UPDATE ${this.options.table} set ${mysql.escape(set)} where ${mysql.escape(where)};`)
  .then(result => debug('touch mysql session %s', id)).catch((e) => {
    this.options.showError && console.error('error to touch mysql session: %s %s', id, e.message);
  });
};

// convert the string to a underline-delimited string which will used in database
function dbName(str) {
  if (!str) return str;
  str = str.replace(/[A-Z]/g, $0 => `_${$0.toLowerCase()}`);
  if (str[0] === '_') return str.slice(1);
  return str;
}

// helper for test
Object.defineProperty(proto, 'length', { get() {
  return this._query(`select count(1) cnt from ${this.options.table};`).then(result => result[0].cnt);
} });

module.exports = MysqlStore;
