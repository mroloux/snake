var http = require('http');
var fs = require('fs');
var net = require('net');
var static = require('node-static');

var staticServer = new static.Server('./web');

http.createServer(function(request, response) {
    staticServer.serve(request, response);
}).listen(9090);

net.createServer(function(socket) {
    socket.write("Hallo " + socket.remoteAddress + ":" + socket.remotePort + "\r\n");
    socket.pipe(socket);
}).listen(9091);

var io = require('socket.io').listen(80);
io.set('log level', 1);

var numPlayers = 0;

function randomPoint(maxX, maxY) {
    var x = Math.round(Math.random() * maxX);
    var y = Math.round(Math.random() * maxY);
    return {"x": x, "y": y};
}

io.sockets.on('connection', function(socket) {
    if(++numPlayers == 2) {
        io.sockets.emit('gaanMetDieBanaan', randomPoint(20, 20));
    }
    socket.on('snakeMoved', function(data) {
        socket.broadcast.emit('otherSnakeMoved', data);
    });
    socket.on('gameOver', function() {
        socket.broadcast.emit('youveWon');
    });
    socket.on('ivewon', function() {
        socket.broadcast.emit('youveLost');
    });
    socket.on('bollekeGepakt', function() {
        io.sockets.emit('verplaatsBolleke', randomPoint(20, 20));
    });
    socket.on('disconnect', function() {
        io.sockets.emit('stopTerMee');
       --numPlayers;
    });
});

console.log('server gestart');