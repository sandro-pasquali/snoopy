var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var http 	= require('http');
var url 	= require('url');
var fs 		= require('fs');

var admins = {
	"spasquali" : {},
	"jjohnson" 	: {}
};

//	HTTP server
//
var server = http.createServer(function(request, response) {

	var parsedURL 	= url.parse(request.url, true);
	var pathname 	= parsedURL.pathname;
	var args		= pathname.split("/");
	var method		= args[1];
	var adminId		= args[2];

	if(method === "favicon.ico") {
		response.end();
	}

  	if(method === "admin") {
  	
  		//	Do nothing for unknown admin.
  		//
  		if(!admins[adminId]) {
  			return response.end();
  		}
  	
  		//	If we are keeping a socket for this admin, do not send
  		//	another page.
  		//
  		if(admins[adminId].socket) {
  			return response.end("You already have an open session. Check your browser windows.");
  		} 
  		
  		return fs.createReadStream("./admin.html").pipe(response);
  	}
  
  	if(method === "receive") {

  		if(!admins[adminId]) {
  			return response.end();
  		}
  		
		response.writeHead(200, {
			"Content-Type": "text/event-stream",
			"Cache-Control": "no-cache",
			"Connection": "keep-alive"
		});
		
		response.write(":" + Array(2049).join(" ") + "\n");
		response.write("retry: 2000\n");

		response.on("close", function() {
			admins[adminId] = {};
		});
		
		setInterval(function() {
			response.write("data: PING\n\n");
		}, 15000);

		admins[adminId].socket = response;

		return;
	}
	
	//	Anything else gets front page
	//
	fs.createReadStream("./client.html").pipe(response);
	
}).listen(8080);

cluster.setupMaster({
	exec	: "sock-worker.js",
	silent	: false
});

if(cluster.isMaster) {

	var i;

	for(i=0; i < numCPUs; i++) {
		cluster.fork();
	}
	
	cluster
	.on('fork', function(worker) {
	})
	.on('online', function(worker) {
	})
	.on('listening', function(worker, address) {
	})
	.on('error', function() {
	})
	.on('exit', function(worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' died');
	})
	.on('disconnect', function(worker, code, signal) {
		console.log('worker ' + worker.process.pid + ' disconnected');
	})

	//	Receive messages from workers
	//
	Object.keys(cluster.workers).forEach(function(id) {
		cluster.workers[id].on('message', function(msg) {
			var a;
			for(a in admins) {		
				if(admins[a].socket) {
					admins[a].socket.write("data: " + JSON.stringify(msg) + "\n\n");
				}
			}
		});
	});
} 