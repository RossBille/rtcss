/**
 * Created by rossbille on 22/05/2015.
 */
import io from 'socket.io-client'

export default class SignallingClient {
    constructor(path) {
        this.path = path;
        this.onId = null;
        this.onClients = null;
        this.onNewClient = null;
        this.onRemove = null;
        this.onMessage = null;

        this.socket = null;
    }

    connect() {
        if (this.onId === null ||
            this.onClients === null ||
            this.onNewClient === null ||
            this.onRemove === null ||
            this.onMessage === null) {
            throw new Error("Please setup all callbacks before trying to connect.");
        }

        this.socket = io.connect(this.path, {reconnection: false});

        this.socket.on('id', (id) => { this.onId(id); });

        this.socket.on('clients', (clients) => { this.onClients(clients); });

        this.socket.on('new client', (client) => { this.onNewClient(client); });

        this.socket.on('remove', (client) => { this.onRemove(client); });

        this.socket.on('message', (message) => { this.onMessage(message); });
    }

    sendMessage(message) {
        this.socket.emit('message', message);
    }
}