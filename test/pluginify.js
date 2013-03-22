var pluginify = require('./../lib/build/pluginify');
var assert = require('assert');

describe('Pluginify', function(){
	it('Pluginifies the hello fixture', function(done) {
		var exporter = {};

		// Run pluginify on hello/hello.js in the current folder.
		// Export it to plguinifyMessage
		// Set the wrapper so that it will be added to the exporter object
		pluginify('hello', {
			root: __dirname,
			exports: {
				'hello/hello.js': 'pluginifyMessage'
			},
			wrapper: '!function(window, undefined) {\n<%= content %>\n\n' +
				'<%= exports.join("\\n") %>\n' +
				'}(exporter);'
		}, function(error, content) {
			// Run the pluginified content
			eval(content);
			// And make sure that the exported object got updated
			assert.equal(exporter.pluginifyMessage, 'Hello World WORLD!');
			done();
		});
	});
});