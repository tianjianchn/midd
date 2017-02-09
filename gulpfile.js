/* eslint import/no-extraneous-dependencies: ["error", {"devDependencies": true}], no-underscore-dangle:off */

// add `use strict` to allow `let` usage in this script
'use strict';//eslint-disable-line

const through = require('through2');
const chalk = require('chalk');
const newer = require('gulp-newer');
const babel = require('gulp-babel');
const sourcemaps = require('gulp-sourcemaps');
const gutil = require('gulp-util');
const gulp = require('gulp');
const path = require('path');

const src = './packages/*/src/**/*.js';
const dest = 'packages';

let reSrcFile,
  reDestFile;
if (path.win32 === path) {
  reSrcFile = /(packages\\[^\\]+)\\src\\/;
  reDestFile = '$1\\dist\\';
} else {
  reSrcFile = new RegExp('(packages/[^/]+)/src/');
  reDestFile = '$1/dist/';
}

function build() {
  const options = process.argv.slice(3);
  const useSourcemap = options.indexOf('-s') >= 0 || options.indexOf('--source-maps') >= 0;
  if (useSourcemap) gutil.log('Building with `--source-maps inline` option...');

  let stream = gulp.src(src)
    .pipe(through.obj((file, enc, callback) => {
      file._path = file.path;
      file.path = file.path.replace(reSrcFile, reDestFile);
      callback(null, file);
    }))
    .pipe(newer(dest))
    .pipe(through.obj((file, enc, callback) => {
      gutil.log('Building', `'${chalk.cyan(file._path)}'...`);
      callback(null, file);
    }));

  if (useSourcemap) stream = stream.pipe(sourcemaps.init());
  stream = stream.pipe(babel());
  if (useSourcemap) {
    stream = stream.pipe(sourcemaps.write());
    // .pipe(sourcemaps.write('.')); // if you want `--source-maps both`, uncomment this line
  }

  stream = stream.pipe(gulp.dest(dest));
  return stream;
}

const watch = gulp.series(build, () => {
  gulp.watch(src, { debounceDelay: 200 }, build)
    .on('error', () => {});
});

module.exports = {
  build, watch,
};
