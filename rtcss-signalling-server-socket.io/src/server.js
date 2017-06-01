/**
 * Created by rossbille on 21/04/2015.
 */
import nodeStatic from "node-static";
import http from "http";
import IO from "socket.io";

const file = new (nodeStatic.Server)();
const port = 2013;

const app = http.createServer(function (req, res) {
    file.serve(req, res);
}).listen(port);
console.log('Started server, listening on ' + port);

const clients = [];

Array.prototype.remove = function (obj) {
    const i = this.indexOf(obj);
    if (i !== -1) {
        this.splice(i, 1);
    }
};

function prefixId(id) {
    return 'id_' + id;
}
function removeIdPrefix(id) {
    return id.substring(3);
}

const io = IO.listen(app);
io.sockets.on('connection', function (socket) {
    socket.id = prefixId(socket.id);

    const thisSocket = socket.id;

    console.log('New connection, socket.id: ' + thisSocket);

    //handle client disconnecting
    socket.on('disconnect', function () {
        console.log('Closed connection, socket.id: ' + thisSocket);
        //remove from servers list of clients
        clients.remove(thisSocket);

        //update clients
        io.sockets.emit('remove', thisSocket);
    });

    //handle client messages
    socket.on('message', function (message) {
        console.log("Got message from: " + thisSocket + ". To: " + message.toClient);
        const toClient = removeIdPrefix(message.toClient);
        const connected = io.sockets.connected;
        if (toClient in connected) {
            connected[toClient].emit('message', message);
        } else {
            console.log("client: " + toClient + " is not connected");
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
    console.log('Current clients: ' + clients);
});