'use strict';
let http = require('http');
let path = require('path');
let fs = require('fs');
let url = require('url');

let mimeTypes = {
	'.js' : 'application/x-javascript',
	'.css' : 'text/css',
	'.html' : 'text/html',
}

http.createServer(function (req, res) {
	let lookup = url.parse(decodeURI(req.url)).pathname;
	lookup = path.normalize(lookup);
	lookup = (lookup === '/') ? '/index.html' : lookup;
	let file = 'dist' + lookup;
	fs.exists(file, function(exists){
		if(exists) {
			fs.readFile(file, function(err, data){
				if(err) {
					res.writeHead(500);
					res.end('Internal Server Error');
				}
				let headers = {
					'Content-Type' : mimeTypes[path.extname(file)],
				};
				res.writeHead(200, headers);
				res.end(data);
			});
			return
		}
		res.writeHead(404);
		res.end('Page Not Found');
	})
}).listen(3333, '127.0.0.1');