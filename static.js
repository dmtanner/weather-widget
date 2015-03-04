var fs = require('fs');
var http = require('http');
var url = require('url');
var ROOT_DIR = "html/";

var server = http.createServer(function (req, res) {
  	var urlObj = url.parse(req.url, true, false);
	// Install Route for getcity
	console.log(urlObj);
	if(urlObj.pathname.indexOf("/getcity") != -1) {
		console.log("In GetCity");
		fs.readFile("cities.dat.txt", function (err, data) {
			if(err) {
				console.log("Error");
				return;
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
	// Return Regular File
	else {
		fs.readFile(ROOT_DIR + urlObj.pathname, function (err,data) {
			if(!err) {
 				res.writeHead(200);
				res.end(data);
			}
			else {
				res.writeHead(404);
      			res.end(JSON.stringify(err));
      			return;
    		}
  		});
	}
});

server.listen(80);

