import gulp from "gulp";
const { src, dest, watch, parallel, series } = gulp;

import browserSync from "browser-sync";
browserSync.create();

// Paths
const pathSrc = "./src";
const pathDist = "./dist";

const paths = {
  root: pathDist,

  html: {
    src: pathSrc + "/html/*.njk",
    watch: pathSrc + "/html/**/*.njk",
    dist: pathDist,
  },

  css: {
    src: pathSrc + "/css/*.{scss,sass}",
    watch: pathSrc + "/css/**/*.{scss,sass}",
    dist: pathDist + "/assets/css",
  },

  js: {
    src: pathSrc + "/js/*.js",
    watch: pathSrc + "/js/**/*.js",
    dist: pathDist + "/assets/js",
  },

  img: {
    src: pathSrc + "/img/**/*.{png,jpg,jpeg,gif,svg}",
    watch: pathSrc + "/img/**/*.{png,jpg,jpeg,gif,svg}",
    dist: pathDist + "/assets/img",
  },

  fonts: {
    src: pathSrc + "/fonts/**/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}",
    watch: pathSrc + "/fonts/**/*.{eot,ttf,otf,otc,ttc,woff,woff2,svg}",
    dist: pathDist + "/assets/fonts",
  },

  libs: {
    src: pathSrc + "/libs/**/*",
    watch: pathSrc + "/libs/**/*",
    dist: pathDist + "/assets/libs",
  },

  meta: {
    src: pathSrc + "/meta/**/*",
    watch: pathSrc + "/meta/**/*",
    dist: pathDist + "/",
  },
};

// Settings
const isProd = process.argv.includes("--production");
const isDev = !isProd;

const settings = {
  isProd: isProd,
  isDev: isDev,

  html: {
    htmlMin: {
      collapseWhitespace: true,
      removeComments: true,
    },

    nunjucksRender: {
      path: ["./src/html/"],
    },
  },

  css: {
    postCssSortMediaQueries: {
      sort: "desktop-first",
    },
  },
};

// Global plugins
import { deleteAsync } from "del";
import notify from "gulp-notify";
import plumber from "gulp-plumber";
import newer from "gulp-newer";

// HTML
import htmlMin from "gulp-htmlmin";
import nunjucksRender from "gulp-nunjucks-render";

const html = () => {
  return src(paths.html.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "HTML",
          message: error.message,
        })),
      })
    )
    .pipe(nunjucksRender(settings.html.nunjucksRender))
    .pipe(htmlMin(settings.html.htmlMin))
    .pipe(dest(paths.html.dist));
};

// CSS
import coreSass from "sass";
import gulpSass from "gulp-sass";
const sass = gulpSass(coreSass);

import postCss from "gulp-postcss";
import postCssCsso from "postcss-csso";
import postCssSortMediaQueries from "postcss-sort-media-queries";
import autoprefixer from "autoprefixer";

const css = () => {
  const postCssPlugins = [
    postCssSortMediaQueries(settings.css.postCssSortMediaQueries),
    autoprefixer(),
    postCssCsso(),
  ];

  return src(paths.css.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "CSS",
          message: error.message,
        })),
      })
    )
    .pipe(sass())
    .pipe(postCss(postCssPlugins))
    .pipe(dest(paths.css.dist));
};

// JavaScript
import babel from "gulp-babel";
import terser from "gulp-terser";

const js = () => {
  return src(paths.js.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "JavaScript",
          message: error.message,
        })),
      })
    )
    .pipe(babel())
    .pipe(terser())
    .pipe(dest(paths.js.dist));
};

// Image
import imageMin from "gulp-imagemin";

const img = () => {
  return src(paths.img.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "Images",
          message: error.message,
        })),
      })
    )
    .pipe(newer(paths.img.dist))
    .pipe(imageMin())
    .pipe(dest(paths.img.dist));
};

// Fonts
import ttf2woff from "gulp-ttf2woff";
import ttf2woff2 from "gulp-ttf2woff2";

const fonts = () => {
  return src(paths.fonts.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "Fonts",
          message: error.message,
        })),
      })
    )
    .pipe(newer(paths.fonts.dist))
    .pipe(ttf2woff())
    .pipe(dest(paths.fonts.dist))
    .pipe(src(paths.fonts.src))
    .pipe(newer(paths.fonts.dist))
    .pipe(ttf2woff2())
    .pipe(dest(paths.fonts.dist));
};

// Libs
const libs = () => {
  return src(paths.libs.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "Libs",
          message: error.message,
        })),
      })
    )
    .pipe(newer(paths.libs.dist))
    .pipe(dest(paths.libs.dist));
};

// Libs
const meta = () => {
  return src(paths.meta.src)
    .pipe(
      plumber({
        errorHandler: notify.onError((error) => ({
          title: "Meta files",
          message: error.message,
        })),
      })
    )
    .pipe(newer(paths.meta.dist))
    .pipe(dest(paths.meta.dist));
};

// Watcher
const watcher = () => {
  watch(paths.html.watch, html).on("all", browserSync.reload);
  watch(paths.css.watch, css).on("all", browserSync.reload);
  watch(paths.js.watch, js).on("all", browserSync.reload);
  watch(paths.img.watch, img).on("all", browserSync.reload);
  watch(paths.fonts.watch, fonts).on("all", browserSync.reload);
  watch(paths.libs.watch, libs).on("all", browserSync.reload);
  watch(paths.meta.watch, meta).on("all", browserSync.reload);
};

// Clear
const clear = () => {
  return deleteAsync(paths.root);
};

// Server
const server = () => {
  browserSync.init({
    server: {
      baseDir: paths.root,
    },
  });
};

// Scripts
const build = series(clear, parallel(html, css, js, img, fonts, libs, meta));
const dev = series(build, parallel(watcher, server));

// Exports
export default settings.isProd ? build : dev;
