/*jshint node:true */
module.exports = function( grunt ) {

grunt.loadNpmTasks( "grunt-git-authors" );
grunt.loadNpmTasks( "grunt-contrib-concat" );
grunt.loadNpmTasks( "grunt-contrib-jshint" );
grunt.loadNpmTasks( "grunt-contrib-qunit" );
grunt.loadNpmTasks( "grunt-contrib-watch" );


function process( code ) {
	return code
		// Embed version
		.replace( /@VERSION/g, grunt.config( "pkg" ).version )
		// Embed date (yyyy-mm-ddThh:mmZ)
		.replace( /@DATE/g, ( new Date() ).toISOString().replace( /:\d+\.\d+Z$/, "Z" ) );
}

grunt.initConfig({
	pkg: grunt.file.readJSON("package.json"),
	concat: {
		"src-js": {
			options: { process: process },
			src: [
				"src/intro.js",
				"src/core.js",
				"src/test.js",
				"src/assert.js",
				"src/equiv.js",
				"src/dump.js",
				"src/diff.js",
				"src/export.js",
				"src/outro.js"
			],
			dest: "dist/qunit.js"
		},
		"src-css": {
			options: { process: process },
			src: [
				"src/qunit.css"
			],
			dest: "dist/qunit.css"
		}
	},
	jshint: {
		options: {
			jshintrc: ".jshintrc"
		},
		gruntfile: [ "Gruntfile.js" ],
		dist: [ "dist/*.js" ],
		addons: {
			options: {
				jshintrc: "addons/.jshintrc"
			},
			files: {
				src: [ "addons/**/*.js" ]
			}
		},
		tests: {
			options: {
				jshintrc: "test/.jshintrc"
			},
			files: {
				src: [ "test/**/*.js" ]
			}
		}
	},
	qunit: {
		qunit: [
			"test/index.html",
			"test/async.html",
			"test/logs.html",
			"test/setTimeout.html"
		]
	},
	watch: {
		files: [ "*", ".jshintrc", "{addons,dist,src,test}/**/{*,.*}" ],
		tasks: "default"
	}
});

grunt.registerTask( "testswarm", function( commit, configFile ) {
	var testswarm = require( "testswarm" ),
		config = grunt.file.readJSON( configFile ).qunit,
		runs = {},
		done = this.async();
	["index", "async", "setTimeout"].forEach(function (suite) {
		runs[suite] = config.testUrl + commit + "/test/" + suite + ".html";
	});
	testswarm.createClient( {
		url: config.swarmUrl,
		pollInterval: 10000,
		timeout: 1000 * 60 * 30
	} )
	.addReporter( testswarm.reporters.cli )
	.auth( {
		id: config.authUsername,
		token: config.authToken
	} )
	.addjob(
		{
			name: "Commit <a href='https://github.com/jquery/qunit/commit/" + commit + "'>" + commit.substr( 0, 10 ) + "</a>",
			runs: runs,
			browserSets: config.browserSets
		}, function( err, passed ) {
			if ( err ) {
				grunt.log.error( err );
			}
			done( passed );
		}
	);
});

grunt.registerTask("default", ["concat", "jshint", "qunit"]);

};
