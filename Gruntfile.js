/**
 * Gruntfile for Angular-Basic-Auth
 */

'use strict';

module.exports = function (grunt) {

	require('load-grunt-tasks')(grunt);

	// Project configuration.
	grunt.initConfig({

		jshint: {
			// general jshint settings
			all: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: [
					'Gruntfile.js',
					'angular-basicauth.js'
				]
			}
		},

		uglify: {
			dist: {
				files: {
					'angular-basicauth.min.js': 'angular-basicauth.js'
				}
			}
		},

		karma: {
			chrome: {
				configFile: 'test/karma.conf.js'
			},
			travis: {
				configFile: 'test/karma-phantom.conf.js'
			}
		}

	});

	grunt.registerTask('test', ['jshint', 'karma:chrome']);
	grunt.registerTask('lint', ['jshint']);
	grunt.registerTask('dist', ['jshint', 'uglify']);
	grunt.registerTask('travis', ['jshint', 'karma:travis']);
};
