var assert = require('assert');
var parse = require('../lib/build/parse');

describe('Steal function parsing', function(){
	it('Extracts the callback function from a single line', function() {
		var text = "steal('./world.js', function(world) { return ' ' + world.toUpperCase() + '!'; });";
		assert.equal(parse(text), "function(world) { return ' ' + world.toUpperCase() + '!'; }");
	});

	it('Extracts a callback even with noise', function() {
		var text = "// A comment\n" +
			"var test; steal('./world.js', './other.js', function(test, other) {\n" +
			"\tvar content = \"Hello \";\n" +
			"return content + test + other; }\n);";

		var expected = "function(test, other) {\n" +
			"\tvar content = \"Hello \";\n" +
			"return content + test + other; }"

		assert.equal(parse(text), expected);
	});
});
