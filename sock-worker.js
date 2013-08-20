var id = process.pid;

var SServer = require('ws').Server;
var socketServer = new SServer({port: 8081});

socketServer.on('connection', function(socket) {
	var lastM = null;
	var kill = function() {
    	lastM && process.send({
			kill : lastM.id
		});
	};
    socket.on('message', function(message) {
    	lastM = JSON.parse(message);
		process.send(lastM);
    });
    
    socket.on('close', kill);
    socket.on('error', kill);
});



