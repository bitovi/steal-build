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

	it('Converts types', function() {
		var moduleName = 'widget';
		var stl = {
			options: {
				ext: 'css'
			}
		};
		var converters = {
			'css': function(name) {
				return 'css!' + name;
			},
			'mustache': function(name) {
				return 'text!' + name;
			}
		};

		assert.equal(amdify.convertExt(stl, moduleName, converters), 'css!widget');
		stl.options.ext = 'mustache';
		assert.equal(amdify.convertExt(stl, moduleName, converters), 'text!widget');
		stl.options.ext = 'txt';
		assert.equal(amdify.convertExt(stl, moduleName, converters), 'widget');
	});

	it('amdifies', function(done) {
		amdify(['hello'], { steal: { root: __dirname + '/fixture/' }, converters: { 'css': function(n) { return 'css!'+n;}} }, function(error, modules) {
			assert.ok(!error);
			assert.ok(modules['hello']);
			assert.ok(modules['hello/other']);
			assert.ok(modules['hello/world']);
			assert.ok(modules['css!hello']);
			assert.equal(modules['hello/world'],
				'define(function() {\n\tvar world = "World";\n\n\n\n\treturn world;\n});')
			assert.equal(modules['hello'], 'define(["hello/world", "hello/other", "css!hello"], ' +
				'function(test, other) {\n\tvar content = "Hello ";\n\n\treturn content + test + other;\n  });')
			done();
		});
	});
});
