var fs = require('fs');
var http = require('http');
var url = require('url');
var ROOT_DIR = "html";

var server = http.createServer(function (req, res) {
  	var urlObj = url.parse(req.url, true, false);
	// getcity REST service
	console.log(urlObj);
	if(urlObj.pathname.indexOf("/getcity") != -1) {
		console.log("In GetCity");
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
	}
	// If this is our comments REST service
	else if(urlObj.pathname === "/comment") {
		    console.log("comment route");

			if(req.method === "POST") {
					console.log("POST comment route");

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
			}
			else if(req.method === "GET") {
				console.log("In GET");
				// Return database entries in a json array
				var MongoClient = require('mongodb').MongoClient;
				MongoClient.connect("mongodb://localhost/weather", function(err, db) {
					if(err)	throw err;
					db.collection('comments', function(err, comments) {
						if(err) throw err;
						comments.find(function(err, items) {
							if(err) throw err;
							items.toArray(function(err, itemArray) {
								console.log("Comment Array");
								console.log(itemArray);
								// Return Array
								res.writeHead(200);
								res.end(JSON.stringify(itemArray.reverse()));
								
							})
						})
					})
				})
			}
	}	
	// Return Regular File
	else {
		console.log('Regular File');
		fs.readFile(ROOT_DIR + urlObj.pathname, function (err,data) {
			if(!err) {
 				res.writeHead(200);
				res.end(data);
			}
			else {
				res.writeHead(404);
      			res.end(JSON.stringify(err));
    		}
  		});
	}
});

server.listen(80);

