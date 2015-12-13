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
  dist: './dist',
  source: './src',
  temp: './temp',
  buildOptionsDir: './src/ts/tsconfigs',
};

/* clean */
gulp.task('before-clean', del.bind(null, [
  `${opt.root}/index.js`,
  `${opt.temp}/**`,
  `${opt.dist}/*.html`,
  `${opt.dist}/js/*.js`,
]));
/**/

gulp.task('build',
  function(done) {
    // seq('clean', 'ts:build-server', 'ts:build-browser', 'browserify', 'copy-css', 'jade', done);
    seq('before-clean', 'ts:build-server', 'ts:build-browser', 'browserify', 'jade', 'copy-js', 'after-clean',done);
  }
);

gulp.task('ts:build-server', shell.task([`npm run ts:build-server`]));
gulp.task('ts:build-browser', shell.task([`npm run ts:build-browser`]));

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
        fs.writeFile(`${opt.dist}/${fileExcludeExt}.html`, text);
      });
    });
  }
);

gulp.task('copy-js', 
  function() {
    return gulp.src(
      [ `${opt.temp}/coordinate-calc.js`, `${opt.temp}/indexeddb-class.js`],
      { base: opt.temp }
    )
    .pipe( gulp.dest( `${opt.dist}/js` ) );
    /**/
  }
);

gulp.task('after-clean', del.bind(null, [
  `${opt.temp}/**`,
]));
/**/

gulp.task('browserify', shell.task([`browserify ${opt.temp}/main.js -o ${opt.dist}/js/main.js`]));
gulp.task('default', ['build']);