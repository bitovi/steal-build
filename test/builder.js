var builder = require('../lib/build/builder');
var assert = require('assert');
var _ = require('underscore');

describe('Steal download builder tests', function() {
	it('loads the fixture package.json and builder.json and passes info', function(done) {
		builder.loadInfo(__dirname + '/fixture', function(error, info) {
			assert.ok(!error);
			assert.equal(info.name, 'builder-test');
			assert.equal(info.filename, 'builder.custom.js');
			assert.equal(_.values(info.modules).length, 2);
			done();
		});
	});

	it('loads all dependencies and their content per configuration', function(done) {
		builder.loadInfo(__dirname + '/fixture', function(error, info) {
			assert.ok(!error);
			assert.equal(info.configurations.dummy.steals.length, 2);
			assert.equal(info.configurations.mapped.steals.length, 2);
			done();
		});
	});
});
