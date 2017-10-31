
var webpackConfig = require('./webpack.config.js');
webpackConfig.entry = { main: __dirname + '/test/unitTestEntry.js' };
webpackConfig.devtool = 'inline-source-map';

module.exports = function (config) {
    config.set({
        files: [
            './test/unitTestEntry.js'
        ],
        webpack: webpackConfig,
        frameworks: ['jasmine'],
        // basePath: './',
        browsers: ['Chrome'],
        reporters: ['spec'],//, 'spec', 'kjhtml'],
        specReporter: { maxLogLines: 5 },
        // changes to the next line will cause build problems
        port: 9876,
        // Maximum of two minute to launch the browser
        captureTimeout: 120000,
        // retry to launch the browser in case it crashes
        browserNoActivityTimeout: 10000,
        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun: false,
        preprocessors: {
            'test/unitTestEntry.js': ['webpack']
        }
    });
};