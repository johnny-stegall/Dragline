/// <binding BeforeBuild="Minify" Clean="Clean" ProjectOpened="Deploy" />
"use strict";

let gulp = require("gulp"),
  concat = require("gulp-concat"),
  cssmin = require("gulp-cssmin"),
  inject = require("gulp-inject"),
  minifier = require("gulp-uglify/minifier"),
  pump = require("pump"),
  rimraf = require("rimraf"),
  sass = require("gulp-sass"),
  uglify = require("uglify-js-harmony");

gulp.task("Clean-CSS", function(callback)
{
  rimraf("./wwwroot/css/*.min.css", callback);
});

gulp.task("Clean-JavaScript", function(callback)
{
  rimraf("./wwwroot/scripts/**/*.min.js", callback);
});

gulp.task("Clean", ["Clean-CSS", "Clean-JavaScript"]);

gulp.task("Compile-SASS", function()
{
  pump(
  [
    gulp.src("./wwwroot/styling/**/*.scss"),
    sass().on("error", function(e)
    {
      console.log(e);
    }),
    gulp.dest("./wwwroot/css/")
  ]);
});

gulp.task("Minify-CSS", function()
{
  pump(
  [
    gulp.src("./wwwroot/css/dragline.css"),
    cssmin(),
    gulp.dest("./wwwroot/css/")
  ]);
  pump(
    [
      gulp.src("./wwwroot/css/dragline-components.css"),
      cssmin(),
      gulp.dest("./wwwroot/css/")
    ]);
});

gulp.task("Minify-JavaScript", function()
{
  pump(
  [
    gulp.src(["./wwwroot/scripts/web-components/**/*.js", "!./wwwroot/scripts/web-components/*.min.js"], { base: "." }),
    concat("./wwwroot/scripts/web-components.min.js"),
    minifier(null, uglify).on("error", function(e)
    {
      console.log(e);
    }),
    gulp.dest("./wwwroot/scripts/")
  ]);
});

gulp.task("Minify", ["Minify-CSS", "Minify-JavaScript"]);

gulp.task("Deploy", function()
{
  gulp.watch("./wwwroot/styling/**/*.scss", ["Clean-CSS", "Compile-SASS"]);
  gulp.watch(["./wwwroot/css/dragline.css", "./wwwroot/css/dragline-components.css"], ["Minify-CSS"]);
  gulp.watch("./wwwroot/scripts/web-components/**/*.js", ["Clean-JavaScript", "Minify-JavaScript"]);
});