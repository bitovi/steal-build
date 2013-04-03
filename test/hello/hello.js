// A comment
var test;

steal('hello/world.js', './other.js', function(test, other) {
	var content = "Hello ";

	return content + test + other;
  });
