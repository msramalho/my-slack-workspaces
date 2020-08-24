const gulp = require('gulp')
const fs = require('file-system')
const {
    src,
    series,
    parallel,
    dest,
    watch
} = require('gulp');
const plumber = require('gulp-plumber')
const gulpif = require('gulp-if')
const browserify = require('browserify')
const preprocessify = require('preprocessify')
const buffer = require('vinyl-buffer')
const source = require('vinyl-source-stream')

const $ = require('gulp-load-plugins')()

// deployment type and target
let production = process.env.NODE_ENV === "production";
let target = process.env.TARGET || "chrome";
let environment = process.env.NODE_ENV || "development";

// read target specific configurations
let generic = JSON.parse(fs.readFileSync(`./config/${environment}.json`));
let specific = JSON.parse(fs.readFileSync(`./config/${target}.json`));
let contextObject = Object.assign({}, generic, specific);


let manifestInfo = {
    dev: {
        "background": {
            "scripts": [
                "scripts/livereload.js",
            ]
        }
    },
    firefox: {
        "applications": {
            "gecko": {
                "id": "my-slack-workspaces@msramalho.github.io"
            }
        }
    }
}

// Tasks
function clean() {
    // remove the build contents
    return src(`./build/${target}`, {
        read: false,
        allowEmpty: true
    }).pipe($.clean())
}

function manifest() {
    // append specific info to manifest and place it in the target folder
    return src('./manifest.json')
        .pipe($.mergeJson({
            fileName: "manifest.json",
            jsonSpace: " ".repeat(4),
            endObj: target === "firefox" ? manifestInfo.firefox : manifestInfo.dev
        }))
        .pipe(gulp.dest(`./build/${target}`))
}

function styles() {
    // convert scss to css in build folder
    return src('src/styles/**/*.scss')
        .pipe(plumber())
        .pipe($.sass.sync({
            outputStyle: 'expanded',
            precision: 10,
            includePaths: ['.']
        }).on('error', $.sass.logError))
        .pipe(dest(`build/${target}/styles`));
}

function mergeAll(done) {
    pipe('./src/icons/**/*', `./build/${target}/icons`)
    pipe(['./src/_locales/**/*'], `./build/${target}/_locales`)
    pipe([`./src/images/${target}/**/*`], `./build/${target}/images`)
    pipe(['./src/images/shared/**/*'], `./build/${target}/images`)
    pipe(['./src/**/*.html'], `./build/${target}`)
    done()
}

function js(done) {
    const files = [
        'contentscript.js',
        'popup.js',
        'livereload.js'
    ]

    let tasks = files.map(file => {
        return browserify({
                entries: 'src/scripts/' + file,
                debug: true
            })
            .transform('babelify', {
                presets: ["@babel/preset-env"]
            })
            .transform(preprocessify, {
                includeExtensions: ['.js'],
                context: contextObject
            })
            .bundle()
            .pipe(source(file))
            .pipe(buffer())
            .pipe(gulpif(!production, $.sourcemaps.init({
                loadMaps: true
            })))
            .pipe(gulpif(!production, $.sourcemaps.write('./')))
            .pipe(gulpif(production, $.uglify({
                "mangle": false,
                "output": {
                    "ascii_only": true
                }
            })))
            .pipe(gulp.dest(`build/${target}/scripts`));
    });
    done();
}

function zip() {
    // zip all files in the target folder for dist
    return pipe(`./build/${target}/**/*`, $.zip(`${target}.zip`), './dist')
}

// watch for any changes in the source folder
function startWatching() {
    $.livereload.listen()
    watch(['./src/**/*']).on("change", () => {
        exports.build();
        $.livereload.reload()
    });
}

// Helpers
function pipe(src, ...transforms) {
    return transforms.reduce((stream, transform) => {
        const isDest = typeof transform === 'string'
        return stream.pipe(isDest ? gulp.dest(transform) : transform)
    }, gulp.src(src))
}

// Export tasks
exports.ext = parallel(manifest, js, mergeAll)
exports.build = series(clean, styles, exports.ext)
exports.dist = series(exports.build, zip)
exports.watch = startWatching
exports.default = exports.build;