
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
		sourceHTML		: '<%= sourcePath %>/html',
		sourceIncludes	: '<%= sourceHTML %>/_includes',
		sourceScripts	: '<%= sourcePath %>/scripts',
		sourceStyles	: '<%= sourcePath %>/styles',
		sourceTemplates : '<%= sourcePath %>/templates',
		sourceImages	: '<%= sourcePath %>/images',
		sourceVendor	: '<%= sourceScripts %>/vendor',
		sitePath		: '<%= basePath %>/public',
		outputAssets	: '<%= sitePath %>/_ui',
		outputScripts	: '<%= outputAssets %>/js',
		outputStyles	: '<%= outputAssets %>/css',
		outputVendor	: '<%= outputScripts %>/lib',
		outputImages	: '<%= outputAssets %>/img',


		// Run web server
		'connect': {
			dev: {
				options: {
					hostname: null,
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
					'<%= sourceVendor %>/modernizr-2.7.0.custom.min.js',
					'<%= sourceVendor %>/json2.js',
					'<%= sourceVendor %>/jquery-1.10.2.min.js',
					'<%= sourceVendor %>/jquery-ui-1.10.3.custom.min.js',
					'<%= sourceVendor %>/underscore-1.5.2.min.js',
					'<%= sourceVendor %>/backbone-1.1.0.min.js',
					'<%= sourceVendor %>/class.js'
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
				'src/scripts/**/*.js',
				'!src/scripts/vendor/**/*',
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

	// Load task dependencies
	require('load-grunt-tasks')(grunt);

	// Register custom tasks
	grunt.registerTask('build', ['includereplace', 'jshint', 'browserify2', 'concat', 'sass']);
	grunt.registerTask('run', ['build', 'connect', 'watch']);

};
