	var dataArray = [20, 40, 60, 80];

	var canvas = d3.select(".graphs")
		.append("svg")
		.attr("width", 1000)
		.attr("height", 500);

	var bars = canvas.selectAll("rect")
		.data(dataArray)
		.enter()
			.append("rect")
			.attr("width", function (d) { return d * 10; })
			.attr("height", 50)
			.attr("y", function (d, i) { return i * 100 });

	//var circle = canvas.append("circle")
	//	.attr('cx', 250)
	//	.attr('cy', 250)
	//	.attr('r', 50)
	//	.attr("fill", "red");
