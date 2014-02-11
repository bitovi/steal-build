var builder = require('../lib/build/builder');
var assert = require('assert');
var _ = require('lodash');

describe('Steal download builder tests', function() {
	it('builder.banner', function() {
		var json = require(__dirname + '/fixture/builder.json');
		var banner = builder.banner(json.banner, { info: { name: 'Bannertest' } });
		assert.equal(banner, '/*! Banner: Bannertest */\n');
	});

	it('builder.prettify', function() {
		var source = "/** some comment */\n\n\n// another one\nfunction() { var x = 1; if(true) { return;;; } }";
		var expected = "// another one\n\nfunction() {\n\tvar x = 1;\n\tif (true) {\n\t\treturn;\n\t}\n}";
		assert.equal(builder.prettify(source, {
			"indent_size": 1,
			"indent_char": "\t"
		}), expected);
	});

	it('loads the fixture package.json and builder.json and passes info', function(done) {
		builder(__dirname + '/fixture', function(error, info, build) {
			assert.ok(!error);
			assert.equal(info.name, 'builder-test');
			assert.equal(info.filename, 'builder.custom.js');
			assert.equal(_.values(info.modules).length, 2);
			assert.equal(typeof build, 'function');
			done();
		});
	});

	it('loads all dependencies and their content per configuration', function(done) {
		builder(__dirname + '/fixture', function(error, info, build) {
			assert.ok(!error);
			assert.equal(info.configurations.dummy.steals.length, 2);
			assert.equal(info.configurations.mapped.steals.length, 2);
			assert.ok(info.configurations.dummy.steals[0].options.text);
			assert.equal(typeof build, 'function');
			done();
		});
	});

	it('builds with default configuration', function(done) {
		builder(__dirname + '/fixture', function(error, info, build) {
			build({}, function(error, content) {
				var exporter = {};
				eval(content);
				assert.equal(exporter.pluginified, 'Hello World WORLD!');
				assert.equal(exporter.planet, 'World');
				done();
			})
		});
	});

	it('builds using configuration with mappings and exports properly', function(done) {
		builder(__dirname + '/fixture', function(error, info, build) {
			build({
				ids: ['fixture/hello'],
				configuration: 'mapped'
			}, function(error, content) {
				var exporter = {};
				eval(content);
				assert.equal(exporter.pluginified, 'Hello Mars MARS!');
				assert.equal(exporter.planet, 'Mars');
				done();
			});
		});
	});
});
