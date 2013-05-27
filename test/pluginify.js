var pluginify = require('./../lib/build/pluginify');
var assert = require('assert');
var vm = require('vm');
var jsdom = require('jsdom');

describe('Pluginify', function() {
	it('Pluginifies with Steal configuration and uses mappings for exporting', function(done) {
		var exporter = {};

		// Run pluginify on hello/hello.js in the current folder.
		// Export it to pluginifyMessage
		// Set the wrapper so that it will be added to the exporter object
		pluginify('hello', {
			exports: {
				'hello/hello.js': 'pluginifyMessage',
				'hello/world.js': 'mappedMessage'
			},
			wrapper: '!function(window, undefined) {\n<%= content %>\n\n' +
				'<%= exports.join("\\n") %>\n' +
				'}(exporter);',
			steal: {
				root: __dirname + '/fixture/',
				map: {
					'*': {
						'hello/world.js': 'hello/mapped.js'
					}
				}
			}
		}, function(error, content) {
			// Run the pluginified content
			vm.runInNewContext(content, {
				exporter: exporter
			});
			// And make sure that the exported object got updated
			assert.equal(exporter.pluginifyMessage, 'Hello Mars MARS!');
			assert.equal(exporter.mappedMessage, 'Mars');
			done();
		});
	});

	it('Pluginifies the hello fixture', function(done) {
		var exporter = {};

		// Run pluginify on hello/hello.js in the current folder.
		// Export it to pluginifyMessage
		// Set the wrapper so that it will be added to the exporter object
		pluginify('hello', {
			steal: {
				root: __dirname + '/fixture/'
			},
			exports: {
				'hello': 'pluginifyMessage',
				'hello/world.js': 'world'
			},
			wrapper: '!function(window, undefined) {\n<%= content %>\n\n' +
				'<%= exports.join("\\n") %>\n' +
				'}(exporter);'
		}, function(error, jsContent, cssContent) {
			// Run the pluginified content
			vm.runInNewContext(jsContent, {
				exporter: exporter
			});
			// And make sure that the exported object got updated
			assert.equal(exporter.pluginifyMessage, 'Hello World WORLD!');
			assert.equal(exporter.world, 'World');
			assert.equal(cssContent, 'body {\n\tbackground: papayawhip;\n}');
			done();
		});
	});

	it('pluginify.ignores', function() {
		var ignores = [ 'bla/x.js', 'foo/', /\/lib\//];
		assert.ok(pluginify.ignores('ma/lib/foo.js', ignores));
		assert.ok(!pluginify.ignores('ma/lib', ignores));
		assert.ok(pluginify.ignores('bla/x.js', ignores));
		assert.ok(!pluginify.ignores('foo', ignores));
		assert.ok(pluginify.ignores('foo/bar.js', ignores));
		assert.ok(!pluginify.ignores('my/foo/bar.js', ignores));
	});

	describe('Pluginifies shims', function() {
		it('with simple exports', function(done) {
			pluginify('shims/dollar.js', {
				steal: {
					root: __dirname + '/fixture/',
					shim: {
						'shims/dollar.js' : {
							exports: 'dollar'
						}
					}
				}
			}, function(error, content) {
				jsdom.env({
					html: '<h1>Pluginify test</h1>',
					src: [content],
					done: function(err, win) {
					assert.equal(win.dollar.name, "Dollar");
					done();
				}});
			});
		});

		it('with function exports', function(done) {
			pluginify('shims/dollar.js', {
				steal: {
					root: __dirname + '/fixture/',
					shim: {
						'shims/dollar.js' : {
							exports: function() {
								return dollar.noConflict();
							}
						}
					}
				}
			}, function(error, content) {
				jsdom.env({
					html: '<h1>Pluginify test</h1>',
					src: [content],
					done: function(err, win) {
					assert.equal(win.dollar.conflict, false);
					done();
				}});
			});
		});

		it('with deps', function(done) {
			pluginify('shims/deps.js', {
				steal: {
					root: __dirname + '/fixture/',
					shim: {
						'shims/dollar.js' : {
							exports: 'dollar'
						},
						'shims/dollar.plugin.js' : {
							deps: ['shims/dollar.js']
						}
					}
				}
			}, function(error, content) {
				jsdom.env({
					html: '<h1>Pluginify test</h1>',
					src: [content],
					done: function(err, win) {
					assert.equal(win.dollar.pluggedIn, true);
					done();
				}});
			});
		});

		it('with function exports and deps', function(done) {
			pluginify('shims/deps.js', {
				steal: {
					root: __dirname + '/fixture/',
					shim: {
						'shims/dollar.js' : {
							exports: function() {
								return dollar.noConflict();
							}
						},
						'shims/dollar.plugin.js' : {
							deps: ['shims/dollar.js'],
							exports: function($) {
								$.name = 'Dollar*';
							}
						}
					}
				}
			}, function(error, content) {
				jsdom.env({
					html: '<h1>Pluginify test</h1>',
					src: [content],
					done: function(err, win) {
					assert.equal(win.dollar.name, 'Dollar*');
					done();
				}});
			});
		});
	});

	describe('Pluginifies templates', function() {
		it('mustache', function(done) {
			pluginify('views/mustache.js', {
				steal: {
					root: __dirname + '/fixture/',
					shim: {
						'views/lib/jquery.js': {
							exports: 'jQuery'
						},
						'views/lib/can.jquery.js': {
							exports: 'can'
						}
					},
					ext: {
						'mustache': 'views/lib/can.view.mustache.js'
					}
				}
			}, function(error, content) {
				jsdom.env({
					html: '<h1>Pluginify test</h1>',
					src: [content],
					done: function(err, win) {
					assert.equal(win.$('h1').text(), "Howdy steal-build!");
					done();
				}});
			});
		});
		it('ejs', function(done) {
			pluginify('views/ejs.js', {
				steal: {
					root: __dirname + '/fixture/',
					shim: {
						'views/lib/jquery.js': {
							exports: 'jQuery'
						},
						'views/lib/can.jquery.js': {
							exports: 'can'
						}
					}
				}
			}, function(error, content) {
				jsdom.env({
					html: '<h1>Pluginify test</h1>',
					src: [content],
					done: function(err, win) {
					assert.equal(win.$('h1').text(), "So long steal-build!");
					done();
				}});
			});
		});
	});
});