
module.exports = function(grunt) {

	var path = require('path');
	var handleify = require('handleify');

	// Project configuration.
	grunt.initConfig({

		// Metadata
		pkg: grunt.file.readJSON('package.json'),
		// pkgName: '<%= pkg.name %>',
		// pkgDesc: '<%= pkg.description %>',
		fileName: '<%= pkg.abbr %>',
		metaTitle: '<%= pkg.title %>',
		portNum : '<%= pkg.portNumber %>',
		lrPortNum : '<%= pkg.livereloadPortNum %>',

		// File Paths
		basePath		: '.',
		sourcePath		: '<%= basePath %>/src',
		sourceData		: '<%= sourcePath %>/data',
		sourceHTML		: '<%= sourcePath %>/html',
		sourceIncludes	: '<%= sourceHTML %>/_includes',
		sourceScripts	: '<%= sourcePath %>/scripts',
		sourceStyles	: '<%= sourcePath %>/styles',
		sourceTemplates : '<%= sourcePath %>/templates',
		sourceImages	: '<%= sourcePath %>/images',
		sourceVendor	: '<%= sourcePath %>/vendor',
		sitePath		: '<%= basePath %>/public',
		outputData		: '<%= sitePath %>/_data',
		outputAssets	: '<%= sitePath %>/_ui',
		outputScripts	: '<%= outputAssets %>/js',
		outputStyles	: '<%= outputAssets %>/css',
		outputVendor	: '<%= outputScripts %>/lib',
		outputImages	: '<%= outputAssets %>/img',


		// Run web server
		'connect': {
			dev: {
				options: {
					port: '<%= portNum %>',
					base: '<%= sitePath %>/',
					livereload: '<%= lrPortNum %>'
				}
			}
		},

		// Compile javascript modules
		'browserify2': {
			compile: {
				entry: '<%= sourceScripts %>/initialize.js',
				compile: '<%= outputScripts %>/<%= fileName %>.js',
				// Precompile Handlebars templates
				beforeHook: function(bundle) {
					bundle.transform(handleify);
				},
				debug: true
			}
		},

		// Build static HTML pages with includes
		'includereplace': {
			dist: {
				options: {
					globals: {
						"meta-title": "<%= metaTitle %>",
						"file-name": "<%= fileName %>"
					},
					includesDir: '<%= sourceIncludes %>'
				},
				files: [{
					src: ['**/*.html', '!_includes/*.html'],
					dest: '<%= sitePath %>/',
					expand: true,
					cwd: '<%= sourceHTML %>/'
				}]
			}
		},

		// Concatenates script files into a single file
		'concat': {
			options: {
				//separator: '\n;\n'
				separator: '\n'
			},
			scripts: {
				src: [
					'<%= sourceVendor %>/modernizr.custom.min.js',
					'<%= sourceVendor %>/jquery.min.js',
					'<%= sourceVendor %>/jquery-ui.min.js',
					'<%= sourceVendor %>/lodash.min.js',
					'<%= sourceVendor %>/backbone.min.js',
					'<%= sourceVendor %>/class.js',
					'<%= sourceScripts %>/shims/classList.js'
				],
				dest: '<%= outputVendor %>/vendor.js'
			}
		},

		// JS Linting using jshint
		'jshint': {
			options: {
				// options here to override JSHint defaults
				globals: {
					$: true,
					_: true,
					jQuery: true,
					Backbone: true,
					Modernizr: true,
					alert: true,
					console: true,
					module: true,
					document: true
				}
			},
			files: [
				'<%= sourceScripts %>/**/*.js',
				'!<%= sourceVendor %>/**/*',
				'!Gruntfile.js'
			]
		},

		// Compile sass to css
		'sass': {
			compile: {
				options: {
					//style: 'expanded',
					style: 'compact',
					debug: false
				},
				files: [{
					src: '<%= sourceStyles %>/styles.scss',
					dest: '<%= outputStyles %>/<%= fileName %>.css'
				}]
			}
		},

		// Watch files for changes
		'watch': {
			options: {
				spawn: false,
				livereload: '<%= lrPortNum %>'
			},
			html: {
				files: '<%= sourceHTML %>/**/*.html',
				tasks: ['includereplace']
			},
			scripts: {
				files: '<%= sourceScripts %>/**/*.js',
				tasks: ['jshint', 'browserify2']
			},
			styles: {
				files: '<%= sourceStyles %>/**/*.*',
				tasks: ['sass']
			},
			templates: {
				files: '<%= sourceTemplates %>/**/*.hbs',
				tasks: ['browserify2']
			}
		}

	});
	// end Grunt task config

	// Load task dependencies
	require('load-grunt-tasks')(grunt);

	// Register custom tasks
	grunt.registerTask('build', ['includereplace', 'jshint', 'browserify2', 'concat', 'sass']);
	grunt.registerTask('run', ['build', 'connect', 'watch']);

};
