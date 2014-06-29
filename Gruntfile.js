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
		}

	});

	grunt.registerTask('test', ['jshint']);
	grunt.registerTask('lint', ['jshint']);
	grunt.registerTask('minify', ['uglify']);

	grunt.registerTask('default', ['jshint', 'uglify']);
};
