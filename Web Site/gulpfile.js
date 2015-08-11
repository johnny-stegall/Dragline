/// <binding BeforeBuild="min" Clean="clean" ProjectOpened="watcher" />
"use strict";

var gulp = require("gulp"),
  rimraf = require("rimraf"),
  concat = require("gulp-concat"),
  cssmin = require("gulp-cssmin"),
  uglify = require("gulp-uglify"),
  sass = require("gulp-sass");

var webRoot = "./wwwroot/";
var jqueryScripts = webRoot + "scripts/dragline/jQuery/**/*.js";
var knockoutScripts = webRoot + "scripts/dragline/Knockout/**/*.js";
var html5Scripts = webRoot + "scripts/dragline/Html5/**/*.js";
var minifiedjQuery = webRoot + "scripts/dragline/jQuery/*.min.js";
var minifiedKnockout = webRoot + "scripts/dragline/Knockout/*.min.js";
var minifiedHtml5 = webRoot + "scripts/dragline/Html5/*.min.js";
var jqueryPlugins = webRoot + "scripts/dragline/jquery-plugins.min.js";
var knockoutBindings = webRoot + "scripts/dragline/knockout-bindings.min.js";
var customElements = webRoot + "scripts/dragline/custom-elements.min.js";
var draglineCss = webRoot + "css/dragline.css";
var minifiedDraglineCss = webRoot + "css/dragline.min.css";

gulp.task("clean:js", function(callback)
{
  rimraf(webRoot + "scripts/**/*.min.js", callback);
});

gulp.task("clean:css", function(callback)
{
  rimraf(webRoot + "css/*.min.css", callback);
});

gulp.task("clean", ["clean:js", "clean:css"]);

gulp.task("min:js", function()
{
  var jquery = gulp.src([jqueryScripts, "!" + minifiedjQuery], { base: "." })
    .pipe(concat(jqueryPlugins))
    .pipe(uglify())
    .pipe(gulp.dest("."));

  var knockout = gulp.src([knockoutScripts, "!" + minifiedKnockout], { base: "." })
    .pipe(concat(knockoutBindings))
    .pipe(uglify())
    .pipe(gulp.dest("."));

  var html5 = gulp.src([html5Scripts, "!" + minifiedHtml5], { base: "." })
    .pipe(concat(customElements))
    .pipe(uglify())
    .pipe(gulp.dest("."));

  return html5;
});

gulp.task("min:css", function()
{
  return gulp.src([draglineCss, "!" + minifiedDraglineCss])
    .pipe(concat(minifiedDraglineCss))
    .pipe(cssmin())
    .pipe(gulp.dest("."));
});

gulp.task("min", ["min:js", "min:css"]);

gulp.task("scripts", function()
{
  return gulp.src(webRoot + "scripts/dragline/**/*.js")
    .pipe(gulp.dest(webRoot + "scripts/"));
});

gulp.task("styling", function()
{
  return gulp.src(webRoot + "styling/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest(webRoot + "css/"));
});

gulp.task("watcher", function()
{
  gulp.watch(webRoot + "styling/*.scss", ["clean:css", "min:css", "styling"]);
  gulp.watch(webRoot + "scripts/dragline/**/*.js", ["clean:js", "min:js", "scripts"]);
});