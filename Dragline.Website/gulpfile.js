/// <binding BeforeBuild="Minify" Clean="Clean" ProjectOpened="Deploy" />
"use strict";

var gulp = require("gulp"),
  rimraf = require("rimraf"),
  concat = require("gulp-concat"),
  cssmin = require("gulp-cssmin"),
  uglify = require("gulp-uglify"),
  sass = require("gulp-sass"),
  inject = require("gulp-inject");

var webRoot = "./wwwroot/";
var draglineCss = webRoot + "css/dragline.css";
var minifiedDraglineCss = webRoot + "css/dragline.min.css";
var html5Scripts = webRoot + "scripts/html5/**/*.js";
var minifiedHtml5 = webRoot + "scripts/html5/*.min.js";
var customElements = webRoot + "scripts/custom-elements.min.js";

gulp.task("Clean CSS", function(callback)
{
  rimraf(webRoot + "css/*.min.css", callback);
});

gulp.task("Clean JavaScript", function(callback)
{
  rimraf(webRoot + "scripts/**/*.min.js", callback);
});

gulp.task("Clean", ["Clean CSS", "Clean JavaScript"]);

gulp.task("Compile SASS", function()
{
  //var webComponents = gulp.src(webRoot + "styling/html5/*.scss")
  //  .pipe(sass().on("error", sass.logError))
  //  .pipe(gulp.dest(webRoot + "css/"));

  return gulp.src(webRoot + "styling/**/*.scss")
    .pipe(sass().on("error", sass.logError))
    .pipe(gulp.dest(webRoot + "css/"));
});

//gulp.task("Web Components", ["carousel.js"], function()
//{
//  return gulp.src(webRoot + "scripts/html5/carousel.js")
//    .pipe(inject(gulp.src(webRoot + "scripts/html5/carousel.js", {read: false}),
//    {
//      starttag: "this.shadowRoot.innerHTML = \"<style>",
//      endtag: "</style>\";"
//    }))
//    .pipe(gulp.dest("."));
//});

gulp.task("Minify CSS", function()
{
  return gulp.src([draglineCss, "!" + minifiedDraglineCss])
    .pipe(concat(minifiedDraglineCss))
    .pipe(cssmin())
    .pipe(gulp.dest("."));
});

gulp.task("Minify JavaScript", function()
{
  return gulp.src([html5Scripts, "!" + minifiedHtml5], { base: "." })
    .pipe(concat(customElements))
    .pipe(uglify())
    .pipe(gulp.dest("."));
});

gulp.task("Minify", ["Minify CSS", "Minify JavaScript"]);

gulp.task("Deploy", function()
{
  gulp.watch(webRoot + "styling/**/*.scss", ["Clean CSS", "Compile SASS"]);
  gulp.watch(webRoot + "css/dragline.css", ["Minify CSS"]);
  gulp.watch(webRoot + "scripts/html5/**/*.js", ["Clean JavaScript", "Minify JavaScript"]);
});