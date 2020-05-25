const { watch, series, src, dest } = require('gulp');
const fs = require("fs");
const browserSync = require('browser-sync');
const rename = require('gulp-rename');
const less = require('gulp-less');
const path = require('path');
const babel = require('gulp-babel');
const clean = require('gulp-clean');
const cleanDir = require('gulp-clean-dir');

 
function server() {
    browserSync({
        server: {
            baseDir: 'dist'
        },
        notify: false
    });
}

function files() {
    return src(['./src/index.html','./src/js/main.js'])
    .pipe(dest('./dist'));
}

function cleanFiles() {    
        return src('./dist') 
        .pipe(cleanDir('./dist'))
        .pipe(dest('./dist'));   
    
}

function babelComp () {
    return src('./src/js/main.js')
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(dest('./dist'))
    .pipe(browserSync.reload({stream: true}));
}

function lessComp() {
    return src('./src/less/**/*.less')
    .pipe(less({
      paths: [ path.join(__dirname, 'less', 'includes') ]
    }))
    .pipe(dest('./dist'))
    .pipe(browserSync.reload({stream: true})); 
}

function bootstrap(cb) {
    if (fs.existsSync('./dist')) {
        cleanFiles();
    }
    files();
    babelComp ();
    lessComp();
    server(); 
   cb();
}

function watchFiles() {
    watch('./src/index.html', function() {
        return src('./src/index.html')
        .pipe(dest('./dist'))
        .pipe(browserSync.reload({stream: true}));        
    });

    watch('./src/js/main.js', babelComp); 

    /*watch('./src/js/main.js', function() {
        return src('./src/js/main.js')
        .pipe(dest('./dist'))
        .pipe(browserSync.reload({stream: true})); 
        
    });*/
    watch('./src/less/*.less', lessComp);
}

exports.lessComp = lessComp;
exports.babelComp = babelComp;
exports.watchFiles = watchFiles;
exports.bootstrap = bootstrap;
exports.cleanFiles = cleanFiles;
exports.files = files;
exports.server = server;

exports.default = series(bootstrap, watchFiles);








