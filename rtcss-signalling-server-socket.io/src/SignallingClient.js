/**
 * Created by rossbille on 22/05/2015.
 */

export default class SignallingClient {
    constructor() {
        this.onId = null;
        this.onClients = null;
        this.onNewClient = null;
        this.onRemove = null;
        this.onMessage = null;

        this.socket = null;
    }

    connect() {
        const me = this;
        if (me.onId === null ||
            me.onClients === null ||
            me.onNewClient === null ||
            me.onRemove === null ||
            me.onMessage === null) {
            throw new Error("Please setup all callbacks before trying to connect.");
        }

        me.socket = io.connect({reconnection: false});

        me.socket.on('id', function (id) {
            me.onId(id);
        });

        me.socket.on('clients', function (clients) {
            me.onClients(clients);
        });

        me.socket.on('new client', function (client) {
            me.onNewClient(client);
        });
        me.socket.on('remove', function (client) {
            me.onRemove(client);
        });
        me.socket.on('message', function (message) {
            me.onMessage(message);
        });
    }

    sendMessage(message) {
        this.socket.emit('message', message);
    }
}