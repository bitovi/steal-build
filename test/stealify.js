var stealify = require('./../lib/build/stealify');
var assert = require('assert');

describe('Stealify', function() {
	it('stealifies', function(done) {
    stealify(['hello'], { steal: { root: __dirname + '/fixture/' } }, function(error, modules) {
			assert.ok(!error);
			assert.ok(modules['hello/world.js']);
			assert.ok(modules['hello/other.js']);
			assert.ok(modules['hello/hello.js']);
			done();
		});
	});
});
