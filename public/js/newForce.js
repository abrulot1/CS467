var svg = d3.select("svg"),
	width = +svg.attr("width"),
	height = +svg.attr("height");

//parse the incoming JSON object
var obj = JSON.parse(document.getElementById("script").getAttribute("jsonObj"));

//variable to know if the keyword if found in the search or not
var keyWordFound = false

//pull out the urls from the JSON object
urls = Object.keys(obj["URLs"]);

//create arrays to hold nodes and links and a variable to hold the last node
var nodes = [],
	lastNodeId = 0,
	links = [];

//loop to get data to create nodes and push them to the nodes array
for (var x = 0; x < urls.length; x++){
	var i = { id: urls[x], reflexive: false, keyword: obj['URLs'][urls[x]]['found'], title: obj["URLs"][urls[x]]['title']};

	nodes.push(i);
}

//loop to add all of the paths between nodes to the links array
for (var i = 0; i < urls.length; i++) {
	for (var j = 0; j < obj["URLs"][urls[i]]["edges"].length; j++) {
		var y = urls.indexOf(obj["URLs"][urls[i]]["edges"][j]);
		
		var k = {
			source: nodes[i], target: nodes[y] , left: false, right: true
		};

		//check if the reverse arrow already exists
		var reverse = false;
		for (var m = 0; m < links.length; m++) {
			if (k.source == links[m].target && k.target == links[m].source) {
				links[m].left = true;
				reverse = true;
				break;
			}
		}

		//if link is not already in array and it's not pointing to itself, add it
		if (!reverse && k["source"] != k["target"]) {
			links.push(k);
		}
	}
}

//set up the simulation and add forces  
var simulation = d3.forceSimulation()
	.nodes(nodes);

var link_force = d3.forceLink(links)
	.id(function (d) { return d.name; });

var charge_force = d3.forceManyBody()
	.strength(-2500);

var center_force = d3.forceCenter(width / 2, height / 2);

simulation
	.force("charge_force", charge_force)
	.force("center_force", center_force)
	.force("links", link_force);

// define arrow markers for graph links
svg.append("defs").append('marker')
	.attr('id', 'end-arrow')
	.attr('viewBox', '0 -5 10 10')
	.attr('refX', 19)
	.attr("refY", 0)
	.attr('markerWidth', 6)
	.attr('markerHeight', 6)
	.attr('orient', 'auto')
	.append('svg:path')
	.attr('d', 'M0,-5L10,0L0,5')
	.attr('fill', 'black');

svg.append('defs').append('marker')
	.attr('id', 'start-arrow')
	.attr('viewBox', '0 -5 10 10')
	.attr('refX', -9)
	.attr('refY', 0)
	.attr('markerWidth', 6)
	.attr('markerHeight', 6)
	.attr('orient', 'auto')
	.append('svg:path')
	.attr('d', 'M10,-5L0,0L10,5')
	.attr('fill', 'black');


//add tick instructions: 
simulation.on("tick", tickActions);

//add encompassing group for the zoom 
var g = svg.append("g")
	.attr("class", "everything")

//add links between nodes
var link = g.append("g")
	.attr("class", "links")
	.selectAll("line")
	.data(links)
	.enter().append("line")
	.attr("stroke-width", 2)
	.attr('marker-start', function (d) { return d.left ? 'url(#start-arrow)' : ''; })
	.attr('marker-end', function (d) { return d.right ? 'url(#end-arrow)' : ''; })
	.style("stroke", "black");

//draw circles for the nodes
var node = g.append("g")
	.attr("class", "nodes")
	.selectAll(".node")
	.data(nodes)
	.enter().append("g")
	.attr("class", "node");

node.append("circle")
	.attr("class", "node")
	.attr("r", 12)
	.style('fill', function (d) {
		var color = "lightGreen";

		//change node color if keyword is found red is true
		if (d.keyword)
			color = "red";

		//change node color to dark green if it is the start page
		else if (d.id == obj["start"])
			color = "blue";
		return color;
	})
	.style('stroke', "black")
	.classed('reflexive', function (d) { return d.reflexive; })

node.on("dblclick", dblclick)
	.on("mouseover", function (d) {
		var g = d3.select(this); // The node

		// The class is used to remove the additional text later
		var info = g.append('svg:text')
			.classed('info', true)
			.attr('x', 20)
			.attr('y', 10)
			.text(function (d) { return d.id; });

		var info = g.append('svg:text')
			.classed('infoTitle', true)
			.attr('x', 20)
			.attr('y', 25)
			.text(function (d) { return d.title; });

	})
	.on("mouseout", function () {
		// Remove the info text on mouse out.
		d3.select(this).select('text.info').remove();
		d3.select(this).select('text.infoTitle').remove();
	});

//add drag capabilities  
var drag_handler = d3.drag()
	.on("start", drag_start)
	.on("drag", drag_drag)
	.on("end", drag_end);

drag_handler(node);


//add zoom capabilities 
var zoom_handler = d3.zoom()
	.on("zoom", zoom_actions);

zoom_handler(svg);   
svg.on("dblclick.zoom", null);


///////////////////////////////////////////////
//-------------FUNCTIONS---------------------//
///////////////////////////////////////////////

//Drag functions
//d is the node 
function drag_start(d) {
	if (!d3.event.active) simulation.alphaTarget(0.3).restart();
	d.fx = d.x;
	d.fy = d.y;
}

//make sure you can't drag the circle outside the box
function drag_drag(d) {
	d.fx = d3.event.x;
	d.fy = d3.event.y;
}

function drag_end(d) {
	if (!d3.event.active) simulation.alphaTarget(0);
	d.fx = null;
	d.fy = null;
}

//Zoom functions 
function zoom_actions() {
	g.attr("transform", d3.event.transform)
}

function tickActions() {
	//update circle positions each tick of the simulation 
	node
		.attr("transform", function (d) {
			return "translate(" + d.x + "," + d.y + ")";
		});

	//update link positions 
	link
		.attr("x1", function (d) { return d.source.x; })
		.attr("y1", function (d) { return d.source.y; })
		.attr("x2", function (d) { return d.target.x; })
		.attr("y2", function (d) { return d.target.y; });
}

function dblclick(a) {
	window.open(a.id);
}