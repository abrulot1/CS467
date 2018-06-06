const express = require("express");

const app = express();
const handlebars = require("express-handlebars").create({ defaultLayout: "main" });
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));	//for serving static files
app.use(bodyParser.json());

var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var cookie = require('cookie');
var setCookie = require('set-cookie');
var cookieCount = 0;

app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set("port", 8080);

app.get("/results", function (req, res) {
    if (req.query.submitButton == 'Start the crawler') {
        var payload = { page: null, method: null, limit: 2, keyword: null };
        payload.page = req.query.page;
        payload.limit = parseInt(req.query.limit);
        payload.method = req.query.method;
        payload.keyword = req.query.keyword;
        var payloadJson = JSON.stringify(payload);

        //get previous cookie or create new array if a cookie hasn't been set
        var cookies = cookie.parse(req.headers.cookie || '');
        var arr = []
        if ("searches" in cookies)
            arr = JSON.parse(cookies["searches"]);
        else
            arr = [];

        //add new search to the array
        arr.push(payloadJson);

        //insert the array into a cookie
        setCookie('searches', JSON.stringify(arr), { path: '/', res: res });
    } else {
		var payloadJson = req.query.cookies;
		//if select none was clicked, then redirect back to homepage
		if (payloadJson == "") {
			res.redirect("/");
			return;
		}
    }

    console.log(payloadJson);
    //send json to server
	var request = new XMLHttpRequest();
	request.open('POST', 'https://webcrawler-201200.appspot.com', false);
	request.setRequestHeader('Content-Type', 'application/json');
	request.send(payloadJson);
	var response = JSON.parse(request.responseText);
	if (request.status == 200) {
		res.render("results", { "jsonObj": JSON.stringify(response) });
	} else {
		alert('Error!');
	}


});

app.get("/", function (req, res) {
    var cookies = cookie.parse(req.headers.cookie || '');
    var searches = [];

    //if there is a cookie names searches, then parse out information from cookie
    if ('searches' in cookies) {
        searches = JSON.parse(cookies["searches"]);
        //revert previous searches back to json objects
        for (var i = 0; i < searches.length; i++) {
            searches[i] = JSON.parse(searches[i]);
        }
    }
    //render page
    res.render("index", { 'cookies': searches });
});

app.get("/force", function (req, res) {
	res.render("force");
});


app.use(function (req, res) {
	res.status(404);
	res.render("404");
});

//error handler function
app.use(function (err, req, res, next) {
	console.error(err.stack);
	res.type("plain/text");
	res.status(500);
	res.render("500");
});

app.listen(app.get("port"), function () {
	console.log('Express started on http://localhost:' + app.get("port"));
});
