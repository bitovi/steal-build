var assert = require('assert');
var opener = require('./../lib/build/open');

describe('Open', function () {
	it('Opens a dependency and gives me the root steal', function (done) {
		opener('hello', { root: __dirname + '/fixture/' }, function (error, steals) {
			assert.equal(steals.length, 1);
			assert.equal(steals[0].options.id.toString(), 'hello/hello.js');
			assert.equal(steals[0].dependencies.length, 3);
			done();
		});
	});

	it('Visits all files in the correct order', function (done) {
		opener('hello', { root: __dirname + '/fixture/' }, function (error, steals) {
			var counter = 3;
			var idList = [ 'hello/hello.js', 'hello/world.js', 'hello/other.js' ];

			opener.visit(steals, function (stl, id) {
				assert.ok(idList.indexOf(id)!== -1);
				if(!--counter) {
					done();
				}
			});
		});
	});
});