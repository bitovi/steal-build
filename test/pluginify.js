var pluginify = require('./../lib/build/pluginify');
var assert = require('assert');

describe('Pluginify', function(){
//	it('Pluginifies the hello fixture', function(done) {
//		var exporter = {};
//
//		// Run pluginify on hello/hello.js in the current folder.
//		// Export it to pluginifyMessage
//		// Set the wrapper so that it will be added to the exporter object
//		pluginify('hello', {
//			steal: {
//				root: __dirname
//			},
//			exports: {
//				'hello': 'pluginifyMessage',
//				'hello/world.js': 'world'
//			},
//			wrapper: '!function(window, undefined) {\n<%= content %>\n\n' +
//				'<%= exports.join("\\n") %>\n' +
//				'}(exporter);'
//		}, function(error, content) {
//			// Run the pluginified content
//			eval(content);
//			// And make sure that the exported object got updated
//			assert.equal(exporter.pluginifyMessage, 'Hello World WORLD!');
//			assert.equal(exporter.world, 'World');
//			done();
//		});
//	});

	it('Pluginifies with Steal configuration', function(done) {
		var exporter = {};

		// Run pluginify on hello/hello.js in the current folder.
		// Export it to pluginifyMessage
		// Set the wrapper so that it will be added to the exporter object
		pluginify('hello', {
			root: __dirname,
			exports: {
				'hello': 'pluginifyMessage'
			},
			wrapper: '!function(window, undefined) {\n<%= content %>\n\n' +
				'<%= exports.join("\\n") %>\n' +
				'}(exporter);',
			steal: {
				root: __dirname,
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
			done();
		});
	});
});