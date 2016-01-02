'use strict';
const del = require('del');
const gulp = require('gulp');
const shell = require('gulp-shell');
const seq = require('run-sequence');
const jade = require('jade');
const fs = require('fs');
const path = require('path');
const browserify = require('browserify');

// dir definition
let opt = {
  root: '.',
  dist: './dist',
  source: './src',
  temp: './temp',
  buildOptionsDir: './src/ts/tsconfigs',
};

/* clean */
gulp.task('before-clean', 
  function () {
    
    // let isExistDistDir = (function(filePath){
    //   try{
    //     fs.statSync(filePath);
    //   }catch(err){
    //     if(err.code == 'ENOENT') return false;
    //   }
    //   return true;
    // })(path.normalize(opt.dist));
    
    // if(isExistDistDir === false){
    //   fs.mkdir(
    //     path.normalize(opt.dist),
    //     function () {
    //       ;
    //     }
    //   );
    // }
    
    del.bind(null, [
      `${opt.root}/index.js`,
      `${opt.temp}/**`,
      `${opt.dist}/*.html`,
      `${opt.dist}/js/*.js`,
    ]);
/**/
  }
);

gulp.task('build',
  function(done) {
    seq('before-clean', 'ts:build-server', 'ts:build-browser', 'browserify', 'jade', 'copy-css','copy-js', 'after-clean',done);
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
        let fileExcludeExt = path.basename(fileName, '.jade');
        fs.writeFile(`${path.normalize(`${opt.dist}/${fileExcludeExt}.html`)}`, text);
      });
    });
  }
);

gulp.task('copy-css', 
  function() {
    return gulp.src(
      [ `${opt.source}/css/**`]
    )
    .pipe( gulp.dest( `${opt.dist}/css` ) );
    /**/
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
// let tempMainJS = path.normalize(`${opt.temp}/main.js`);
// let distMainJS = path.normalize(`${opt.dist}/js/main.js`);
// gulp.task('browserify', shell.task([`browserify ${tempMainJS} -o ${distMainJS}`]));
gulp.task(
  'browserify',
  function () {
    browserify({
      entries : [`${opt.temp}/main.js`],
    }).bundle()
    .pipe(gulp.dest(`${opt.dist}/js/`))
  }
);


gulp.task('default', ['build']);