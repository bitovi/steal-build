var assert = require('assert');
var opener = require('./../lib/build/open');

describe('Open', function(){
	it('Opens a dependency and gives me the root steal', function(done) {
		opener('hello', __dirname, function(error, steals) {
			assert.equal(steals.length, 1);
			assert.equal(steals[0].options.id.toString(), 'hello/hello.js');
			assert.equal(steals[0].dependencies.length, 3);
			done();
		});
	});
});