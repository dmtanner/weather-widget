var express = require('express');
var https = require('https');
var http = require('http');
var fs = require('fs');
var url = require('url');
var bodyParser = require('body-parser');
var basicAuth = require('basic-auth-connect');

var app = express();
var options = {
	host: '127.0.0.1',
	key: fs.readFileSync('ssl/server.key'),
	cert: fs.readFileSync('ssl/server.crt')
};

var auth = basicAuth( function(user, pass) {
	return(user==="CS360" && pass==="testing");
});

http.createServer(app).listen(80);
https.createServer(options, app).listen(443);

app.get('/', function (req, res) {
	res.send("Get Index");
});
app.get('/getcity', function(req, res) {
	
  		var urlObj = url.parse(req.url, true, false);
		
		fs.readFile("cities.dat.txt", function (err, data) {
			if(err) {
				console.log("Error");
				res.writeHead(200);
				res.end(JSON.stringify(err));
			}	

			var cities = data.toString().split("\n");
			var myRegex = new RegExp("^" + urlObj.query["q"]);
			var jsonResult = [];

			for(var i = 0; i < cities.length; i++) {
				var result = cities[i].search(myRegex);
				if(result != -1) {
					console.log(cities[i]);
					jsonResult.push({city:cities[i]});
				}
			}

			res.writeHead(200);
			res.end(JSON.stringify(jsonResult));
		});

});

app.use(bodyParser());

app.get('/comment', function(req, res) {

		// Return database entries in a json array
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect("mongodb://localhost/weather", function(err, db) {
			if(err)	throw err;
			db.collection('comments', function(err, comments) {
				if(err) throw err;
				comments.find(function(err, items) {
					if(err) throw err;
					items.toArray(function(err, itemArray) {
						console.log("Comment Array Sending");
						
						// Return Array
						res.writeHead(200);
						res.end(JSON.stringify(itemArray.reverse()));
					})
				})
			})
		})
});

app.post('/comment', auth, function(req, res) {
	
	jsonData = "";
	req.on('data', function (chunk) {
		jsonData += chunk;
	});
	req.on('end', function () {
		var reqObj = JSON.parse(jsonData);
		console.log(reqObj);
		console.log("Name: "+reqObj.Name);
		console.log("Comment: "+reqObj.Comment);

		// Insert comment into MongoDB
		var MongoClient = require('mongodb').MongoClient;
		MongoClient.connect("mongodb://localhost/weather", function(err, db) {
				if(err) {
					res.writeHead(400);
					res.end("Database Error");
				}
				db.collection('comments').insert(reqObj, function(err, records) {
						if(err) {
							res.writeHead(400);
							res.end("Database Error");
						}
						
						console.log("Recorded as " + records[0]._id);
				})

				res.writeHead(200);
				res.end("");
		});
	});
	
});

app.use('/', express.static('./html', {maxAge: 60*60*1000}));

