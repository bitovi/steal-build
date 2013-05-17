var amdify = require('./../lib/build/amdify');
var assert = require('assert');

describe('Amdify', function() {
	it('Converts names', function() {
		var stl = {
			options: {
				id: 'can/view/ejs/ejs.js',
				ext: 'js'
			}
		}

		assert.equal(amdify.convertName(stl), 'can/view/ejs');
		stl.options.id = 'can/view/bla.js';
		assert.equal(amdify.convertName(stl), 'can/view/bla');
		assert.equal(amdify.convertName(stl, {
			'can/': 'stuff/'
		}), 'stuff/view/bla');
		assert.equal(amdify.convertName(stl, {
			'can/view/bla': 'stuff/mooh/kuh'
		}), 'stuff/mooh/kuh');
	});

	it('amdifies', function(done) {
		amdify(['hello'], { steal: { root: __dirname + '/fixture/' } }, function(error, modules) {
			assert.ok(!error);
			assert.ok(modules['hello']);
			assert.ok(modules['hello/other']);
			assert.ok(modules['hello/world']);
			assert.equal(modules['hello/world'],
				'define(function() {\n\tvar world = "World";\n\n\n\n\treturn world;\n});')
			assert.equal(modules['hello'], 'define(["hello/world", "hello/other"], ' +
				'function(test, other) {\n\tvar content = "Hello ";\n\n\treturn content + test + other;\n  });')
			done();
		});
	});
});
