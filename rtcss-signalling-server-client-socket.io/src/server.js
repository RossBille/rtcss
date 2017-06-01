/**
 * Created by rossbille on 21/04/2015.
 */
var info = 'info';

function log(level, message) {
    console.log(message);
}
var nodeStatic = require('node-static');
var http = require('http');
nodeStatic.mime.types.ts = "application/x-typescript";
var file = new (nodeStatic.Server)();
var port = 2013;

var app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(port);
log(info, 'Started server, listening on ' + port);

var clients = [];

Array.prototype.remove = function (obj) {
    var i = this.indexOf(obj);
    if (i != -1) {
        this.splice(i, 1);
    }
};

function prefixId(id) {
    return 'id_' + id;
}
function removeIdPrefix(id) {
    var newId = id.substring(3);
    return newId;
}


var io = require('socket.io').listen(app);
io.sockets.on('connection', function (socket) {
    socket.id = prefixId(socket.id);

    var thisSocket = socket.id;

    log(info, 'New connection, socket.id: ' + thisSocket);

    //handle client disconnecting
    socket.on('disconnect', function () {
        log(info, 'Closed connection, socket.id: ' + thisSocket);
        //remove from servers list of clients
        clients.remove(thisSocket);

        //update clients
        io.sockets.emit('remove', thisSocket);
    });

    //handle client messages
    socket.on('message', function (message) {
        log(info, "Got message from: " + thisSocket + ". To: " + message.toClient);
        var toClient = removeIdPrefix(message.toClient);
        var connected = io.sockets.connected;
        if (toClient in connected) {
            connected[toClient].emit('message', message);
        } else {
            log("error", "client: " + toClient + " is not connected");
            clients.remove(toClient);
        }
    });


    //tell this client their id
    socket.emit('id', thisSocket);

    //tell this client the ids of the other clients
    socket.emit('clients', clients);

    //tell all other clients about the new client
    io.sockets.emit('new client', thisSocket);

    //add this client to the servers list of clients
    clients.push(thisSocket);
    log(info, 'Current clients: ' + clients);
});