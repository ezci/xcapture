
var gulp = require('gulp'),
    clean = require('gulp-clean'),
    zip = require('gulp-zip')

var path = {
        html: "src/html/**",
        scripts: "src/scripts/**",
		assets: "src/assets/**",
        dist: "dist",
        package: 'package',
        manifest: 'src/manifest.json'
    }

gulp.task('manifest', () => {
    return gulp.src([path.manifest], {
        base: 'src'
    })
        .pipe(gulp.dest(path.dist))
})

gulp.task('js', () => {
    return gulp.src(path.scripts, {
        base: 'src'
    })
        .pipe(gulp.dest(path.dist))
})

gulp.task('assets', () => {
    return gulp.src(path.assets, {
        base: 'src'
    })
        .pipe(gulp.dest(path.dist))
})

gulp.task('html', () => {
    return gulp.src(path.html, {
        base: 'src'
    })
        .pipe(gulp.dest(path.dist))
})


gulp.task('zip', gulp.series(() => {
    var manifest = require('./dist/manifest.json')
    return gulp.src(path.dist)
        .pipe(zip(`${manifest.name}-${manifest.version}.zip`))
        .pipe(gulp.dest(path.package))
}))

gulp.task('clean', gulp.series(()=> gulp.src([path.dist, path.package], {
    read: false,
    allowEmpty : true
    }).pipe(clean()))
)
gulp.task('load', gulp.series('manifest', 'js', 'assets', 'html'))
gulp.task('default', gulp.series('clean', 'load'))
gulp.task('package', gulp.series('clean', 'load', 'zip'))