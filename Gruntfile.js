
module.exports = function(grunt) {

	'use strict';

	var path			= require('path');
	var cwd				= process.cwd();
	var pkg				= grunt.file.readJSON('package.json');
	var remapify		= require('remapify');


	// Project configuration.
	grunt.initConfig({

		// Pkg data
		pkg				: pkg,
		pkgName: '<%= pkg.name %>',
		pkgDesc: '<%= pkg.description %>',
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


		// Start a connect web server
		'connect': {
			dev: {
				options: {
					hostname: '*',
					port: '<%= portNum %>',
					base: '<%= sitePath %>/',
					livereload: '<%= lrPortNum %>'
				}
			}
		},

		// Compile javascript modules
		'browserify': {
			compile: {
				src: '<%= sourceScripts %>/initialize.js',
				dest: '<%= outputScripts %>/<%= pkgName %>.js',
				options: {
					preBundleCB: function(b) {
						b.plugin(remapify, [
							{
								cwd: './src/templates',
								src: './**/*.hbs',
								expose: 'templates'
							},
							{
								cwd: './src/scripts/config',
								src: './**/*.js',
								expose: 'config'
							},
							{
								cwd: './src/scripts/utilities',
								src: './**/*.js',
								expose: 'utilities'
							},
							{
								cwd: './src/scripts/widgets',
								src: './**/*.js',
								expose: 'widgets'
							}
						]);
					},
					browserifyOptions: {
						extensions: ['.hbs'],
						fullPaths: false
					},
					debug: true
				}
			}
		},

		// Build static HTML pages with includes
		'includereplace': {
			dist: {
				options: {
					globals: {
						"meta-title": "<%= metaTitle %>",
						"file-name": "<%= pkgName %>"
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
				separator: '\n\n'
			},
			scripts: {
				src: [
					'<%= sourceVendor %>/modernizr.custom.min.js',
					'<%= sourceVendor %>/jquery.min.js',
					'<%= sourceVendor %>/jquery-ui.min.js',
					'<%= sourceVendor %>/underscore.min.js',
					'<%= sourceVendor %>/backbone.min.js',
					'<%= sourceVendor %>/backbone-super.min.js',
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
					'alert': true,
					'console': true,
					'document': true,
					'module': true,
					'require': true,
					'window': true,
					'Modernizr': true,
					'jQuery': true,
					'$': true,
					'_': true,
					'Backbone': true
				}
			},
			files: [
				'<%= sourceScripts %>/**/*.js',
				'!<%= sourceScripts %>/shims/classList.js'
			]
		},

		// Compile Sass to CSS
		'sass': {
			compile: {
				options: {
					style: 'expanded'
				},
				files: [{
					src: '<%= sourceStyles %>/styles.scss',
					dest: '<%= outputStyles %>/<%= pkgName %>.css'
				}]
			}
		},

		// Add vendor-prefixed CSS properties
		'autoprefixer': {
			compile: {
				options: {
					browsers: ['last 2 versions', 'ie 9'],
					map: true
				},
				files: [{
					src: '<%= outputStyles %>/<%= pkgName %>.css',
					dest: '<%= outputStyles %>/<%= pkgName %>.css'
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
				tasks: ['jshint', 'browserify']
			},
			styles: {
				files: '<%= sourceStyles %>/**/*.scss',
				tasks: ['sass', 'autoprefixer']
			},
			templates: {
				files: '<%= sourceTemplates %>/**/*.hbs',
				tasks: ['browserify']
			}
		}

	});
	// end Grunt task config

	// Load task dependencies
	grunt.loadNpmTasks('grunt-autoprefixer');
	grunt.loadNpmTasks('grunt-browserify');
	grunt.loadNpmTasks('grunt-include-replace');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-connect');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-sass');
	grunt.loadNpmTasks('grunt-contrib-watch');


	// Register custom tasks
	grunt.registerTask('build', ['includereplace', 'sass', 'autoprefixer', 'concat', 'jshint', 'browserify']);
	grunt.registerTask('run', ['build', 'connect', 'watch']);

};
