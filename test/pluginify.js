var pluginify = require('./../lib/build/pluginify');
var assert = require('assert');
var fs = require('fs');

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
			eval(content);
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
		}, function(error, content) {
			// Run the pluginified content
			eval(content);
			// And make sure that the exported object got updated
			assert.equal(exporter.pluginifyMessage, 'Hello World WORLD!');
			assert.equal(exporter.world, 'World');
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

	it('Pluginifies the a nonsteal fixture', function(done) {
		pluginify('nonsteal.js', {
			steal: {
				root: __dirname + '/fixture/'
			},
			wrapper: '!function(window) {\n<%= content %>\n}(window);'
		}, function(error, content) {
			fs.readFile('test/fixture/nonsteal-shim.js', function(err, data) {
				var text = data.toString();

				assert.equal(content, text);
				done();
			});
		});
	});
});