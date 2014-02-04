steal(function() {
	var world = "World";

	//!steal-remove-start
	world = "Steal";
	//!steal-remove-end
//!steal-remove-start
	world = "Dev";
//!steal-remove-end

	return world;
});
