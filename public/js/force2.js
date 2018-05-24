﻿//set up SVG for D3
var width = 800,
	height = 600;



var svg = d3.select('body')
	.append('svg')
	.attr('oncontextmenu', 'return false;')
	.attr('width', width)
	.attr('height', height);
var obj = JSON.parse(document.getElementById("script").getAttribute("jsonObj"));

var keyWordFound = false


urls = Object.keys(obj["URLs"]);

//console.log(urls);

var nodes = [],
	lastNodeId = 0,
	links = [];

for (var x = 0; x < urls.length; x++){
	var i = { id: urls[x], reflexive: false, keyword: obj['URLs'][urls[x]]['found'], title: obj["URLs"][urls[x]]['title']};

	nodes.push(i);
	//console.log(nodes);
}

for (var i = 0; i < urls.length; i++) {
	for (var j = 0; j < obj["URLs"][urls[i]]["edges"].length; j++) {
		var y = urls.indexOf(obj["URLs"][urls[i]]["edges"][j]);
		//console.log(y);
		
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

		if (!reverse && k["source"] != k["target"]) {
			links.push(k);
		}
	}
}

//// init D3 force layout
//var force = d3.layout.force()
//	.nodes(nodes)
//	.links(links)
//	.size([width, height])
//	.linkDistance(150)
//	.charge(-500)
//	.on('tick', tick)
//set up the simulation and add forces  
var simulation = d3.forceSimulation()
	.nodes(nodes);

var link_force = d3.forceLink(links)
	.id(function (d) { return d.name; });

var charge_force = d3.forceManyBody()
	.strength(-500);

var center_force = d3.forceCenter(width / 2, height / 2);

simulation
	.force("charge_force", charge_force)
	.force("center_force", center_force)
	.force("links", link_force);

//add tick instructions: 
simulation.on("tick", tick);


// define arrow markers for graph links
svg.append('svg:defs').append('svg:marker')
	.attr('id', 'end-arrow')
	.attr('viewBox', '0 -5 10 10')
	.attr('refX', 6)
	.attr('markerWidth', 3)
	.attr('markerHeight', 3)
	.attr('orient', 'auto')
	.append('svg:path')
	.attr('d', 'M0,-5L10,0L0,5')
	.attr('fill', '#000');

svg.append('svg:defs').append('svg:marker')
	.attr('id', 'start-arrow')
	.attr('viewBox', '0 -5 10 10')
	.attr('refX', 4)
	.attr('markerWidth', 3)
	.attr('markerHeight', 3)
	.attr('orient', 'auto')
	.append('svg:path')
	.attr('d', 'M10,-5L0,0L10,5')
	.attr('fill', '#000');


// handles to link and node element groups
var path = svg.append('svg:g').selectAll('path'),
	circle = svg.append('svg:g').selectAll('g');

// mouse event vars
var selected_node = null,
	selected_link = null,
	mousedown_link = null,
	mousedown_node = null,
	mouseup_node = null;


// path (link) group
path = path.data(links);

// add new links
path.enter().append('svg:path')
	.attr('class', 'link')
	.selectAll("path")
	.classed('selected', function (d) { return d === selected_link; })
	.style('marker-start', function (d) { return d.left ? 'url(#start-arrow)' : ''; })
	.style('marker-end', function (d) { return d.right ? 'url(#end-arrow)' : ''; })

circle = circle.data(nodes, function (d) { return d.id; });
	
//--------------------------------------------------------------------------
// add new nodes
var g = circle.enter().append('svg:g');

g.append('svg:circle')
	.attr('class', 'node')
	.selectAll("g")
	.attr('r', 12)
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
	.on("dblclick", dblclick)
	.on("mouseover", function (d) {
		var g = d3.select(this); // The node

		// The class is used to remove the additional text later
		var info = g.append('svg:text')
			.classed('info', true)
			.attr('x', 20)
			.attr('y', 10)
			.text(function (d) { return d.id; });
		var moreinfo = g.append('svg:text')
			.classed('moreinfo', true)
			.attr('x', 20)
			.attr('y', 25)
			.text(function (d) { return d.title; });

	})
	.on("mouseout", function () {
		// Remove the info text on mouse out.
		d3.select(this).select('text.info').remove();
		d3.select(this).select('text.moreinfo').remove();
	});



//------------------FUNCTIONS---------------------------------------------//
function mouseup() {
	if (mousedown_node) {
		// hide drag line
		drag_line
			.classed('hidden', true)
			.style('marker-end', '');
	}

	// because :active only works in WebKit?
	svg.classed('active', false);

	// clear mouse event vars
	resetMouseVars();
}


// only respond once per keydown
var lastKeyDown = -1;

function keydown() {
	d3.event.preventDefault();

	if (lastKeyDown !== -1) return;
	lastKeyDown = d3.event.keyCode;

	// ctrl
	if (d3.event.keyCode === 17) {
		circle.call(force.drag);
		svg.classed('ctrl', true);
	}

	if (!selected_node && !selected_link) return;
}

function keyup() {
	lastKeyDown = -1;

	// ctrl
	if (d3.event.keyCode === 17) {
		circle
			.on('mousedown.drag', null)
			.on('touchstart.drag', null);
		svg.classed('ctrl', false);
	}
}

function dblclick(a) {
	window.open(a.id);
}

function resetMouseVars() {
	mousedown_node = null;
	mouseup_node = null;
	mousedown_link = null;
}

// update force layout (called automatically each iteration)
function tick() {
	// draw directed edges with proper padding from node centers
	path.attr('d', function (d) {
		var deltaX = d.target.x - d.source.x,
			deltaY = d.target.y - d.source.y,
			dist = Math.sqrt(deltaX * deltaX + deltaY * deltaY),
			normX = deltaX / dist,
			normY = deltaY / dist,
			sourcePadding = d.left ? 17 : 12,
			targetPadding = d.right ? 17 : 12,
			sourceX = d.source.x + (sourcePadding * normX),
			sourceY = d.source.y + (sourcePadding * normY),
			targetX = d.target.x - (targetPadding * normX),
			targetY = d.target.y - (targetPadding * normY);
		return 'M' + sourceX + ',' + sourceY + 'L' + targetX + ',' + targetY;
	});

	circle.attr('transform', function (d) {
		return 'translate(' + d.x + ',' + d.y + ')';
	});
}
//add drag capabilities  
var drag_handler = d3.drag()
	.on("start", drag_start)
	.on("drag", drag_drag)
	.on("end", drag_end);

drag_handler(g);


//add zoom capabilities 
var zoom_handler = d3.zoom()
	.on("zoom", zoom_actions);

zoom_handler(svg);

/** Functions **/



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
		.attr("cx", function (d) { return d.x; })
		.attr("cy", function (d) { return d.y; });

	//update link positions 
	link
		.attr("x1", function (d) { return d.source.x; })
		.attr("y1", function (d) { return d.source.y; })
		.attr("x2", function (d) { return d.target.x; })
		.attr("y2", function (d) { return d.target.y; });
} 