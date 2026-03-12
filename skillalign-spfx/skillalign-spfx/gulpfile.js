'use strict';

const path = require('path');
const gulp = require('gulp');
const build = require('@microsoft/sp-build-web');

build.addSuppression(`Warning - [sass] The local CSS class 'ms-Grid' is not camelCase and will not be type-safe.`);

var getTasks = build.rig.getTasks;
build.rig.getTasks = function () {
  var result = getTasks.call(build.rig);

  result.set('serve', result.get('serve-deprecated'));

  return result;
};

// Custom subtask to copy .txt app files from src to lib
const copyAppFiles = build.subTask('copy-app-files', function (gulp, buildOptions, done) {
  return gulp.src('src/webparts/skillAlign/app/*.txt')
    .pipe(gulp.dest('lib/webparts/skillAlign/app'));
});

build.rig.addPreBuildTask(copyAppFiles);

// Configure webpack to load .txt files as raw strings (webpack 5 asset/source)
build.configureWebpack.mergeConfig({
  additionalConfiguration: (generatedConfiguration) => {
    generatedConfiguration.module.rules.push({
      test: /\.txt$/,
      type: 'asset/source'
    });
    return generatedConfiguration;
  }
});

build.initialize(gulp);
