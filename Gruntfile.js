/**
 * Gruntfile for Angular-Basic-Auth
 */

'use strict';

module.exports = function (grunt) {

	// Project configuration.
	grunt.initConfig({

		jshint: {
			// general jshint settings
			all: {
				options: {
					jshintrc: '.jshintrc'
				},
				src: [
					'*.js'
				]
			}
		}

	});

	// load the plugins required
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.registerTask('test', ['jshint']);
	grunt.registerTask('lint', ['jshint']);

	grunt.registerTask('default', ['jshint']);
};
