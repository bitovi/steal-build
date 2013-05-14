var utilities = require('../lib/build/utilities');
var assert = require('assert');
var _ = require('underscore');

describe('Steal build utilities test', function() {
	it('.banner', function() {
		var builder = require(__dirname + '/fixture/builder.json');
		var banner = utilities.banner(builder.banner, { info: { name: 'Bannertest' } });
		assert.equal(banner, '/*! Banner: Bannertest */\n');
	});

	it('.prettify', function() {
		var source = "/** some comment */\n\n\n// another one\nfunction() { var x = 1; if(true) { return;;; } }";
		var expected = "// another one\n\nfunction() {\n\tvar x = 1;\n\tif (true) {\n\t\treturn;\n\t}\n}";
		assert.equal(utilities.prettify(source, {
			"indent_size": 1,
			"indent_char": "\t"
		}), expected);
	});

	it('.uglify', function() {
		var source = "(function() {\n\nvar longName = 10; return longName; })();";
		var expected = "!function(){var n=10;return n}();";
		assert.equal(utilities.uglify(source), expected);
	});
});
