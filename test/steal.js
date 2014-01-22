var steal = require('./../lib/steal');
var assert = require('assert');

describe('Steal', function(){
	it('Steals files and loads modules', function(done) {
		steal('test/fixture/hello', function(message) {
			assert.equal(message, 'Hello Dev DEV!');
			done();
		});
	});
});
