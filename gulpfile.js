'use strict';
let del = require('del');
let gulp = require('gulp');
let shell = require('gulp-shell');
let seq = require('run-sequence');
let jade = require('jade');
let fs = require('fs');

// dir definition
var opt = {
  root: '.',
  build: './build',
  lib: './lib',
  source: './src',
  temp: './temp',
  buildOptionsDir: './src/ts/tsconfigs',
};

/* clean */
gulp.task('clean', del.bind(null, [
  `${opt.root}/main.js`,
  `${opt.temp}/**`,
]));
/**/

gulp.task('build',
  function(done) {
    // seq('clean', 'ts:build-server', 'ts:build-browser', 'browserify', 'copy-css', 'jade', done);
    seq('clean', 'ts:build-server', 'ts:build-browser', done);
  }
);

gulp.task('ts:build-server', shell.task([`tsc -p ${opt.buildOptionsDir}/server`]));
gulp.task('ts:build-browser', shell.task([`tsc -p ${opt.buildOptionsDir}/browser`]));

gulp.task('jade',
  function () {
    fs.readdir(`${opt.source}/views`, function(err, files){
      if (err) throw err;
      let fileList = [];
      files.forEach((file) => {
          fileList.push(file);
      });
      fileList.forEach(
        (fileName) => {
        let text = jade.renderFile(`${opt.source}/views/${fileName}`);
        let fileExcludeExt = fileName.split('.')[0];
        fs.writeFile(`${opt.build}/${fileExcludeExt}.html`, text);
      });
    });
  }
);

gulp.task('default', ['build']);