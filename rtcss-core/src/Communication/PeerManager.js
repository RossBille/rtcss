/**
 * Created by rossbille on 22/05/2015.
 */

import DataChannel from "./DataChannel";
import WritableTrackedAttribute from "./Attributes/WritableTrackedAttribute";

export default class PeerManager {

    constructor(signallingServer,
                onReceivedAttribute,
                onReceivedConnection,
                onRemovedConnection,
                onRemoveAttribute,
                config) {

        this.sdpConstraints = {
            'mandatory': {
                'OfferToReceiveAudio': false,
                'OfferToReceiveVideo': false
            }
        };

        this.signallingServer = signallingServer;
        this.onReceivedAttribute = onReceivedAttribute;
        this.onReceivedConnection = onReceivedConnection;
        this.onRemovedConnection = onRemovedConnection;
        this.onRemoveAttribute = onRemoveAttribute;

        this.attributes = {};
        this.clients = {};

        this.config = config;

        this.setupSignallingServer();

        this.stats = navigator.mozGetUserMedia ? this.mozillaGetStats : this.chromeGetStats;

        const existingOnBeforeUnload = window.onbeforeunload;

        window.onbeforeunload = () => {
            for (const clientId in this.clients) {
                if (this.clients.hasOwnProperty(clientId)) {
                    const client = this.clients[clientId];
                    client.pc.datachannel.fire("disconnect");
                }
            }
            if (existingOnBeforeUnload) {
                existingOnBeforeUnload();
            }
        }
    }

    mozillaGetStats(clientId, selector = null) {
        return this.clients[clientId].pc.peerconnection.getStats(selector);
    }

    chromeGetStats(clientId, selector = null) {
        return new Promise((resolve, reject) => {
            this.clients[clientId].pc.peerconnection.getStats((response) => {
                const standardReport = {};
                response.result().forEach((report) => {
                    const standardStats = {
                        id: report.id,
                        type: report.type
                    };
                    report.names().forEach((name) => {
                        standardStats[name] = report.stat(name);
                    });
                    standardReport[standardStats.id] = standardStats;
                });
                resolve(standardReport);
            }, selector, reject);
        });
    }

    getStats(selector = null) {
        return Object.keys(this.clients).map(clientId => this.stats(clientId, selector));
    }

    setupSignallingServer() {

        this.signallingServer.onId = (value) => {
            this.id = value;
        };

        this.signallingServer.onClients = (clients) => {
            console.log("#onClients()");
            console.log(clients);
            clients.forEach((client) => {
                this.addClient(client, false);
            })
        };

        this.signallingServer.onNewClient = (client) => {
            this.addClient(client, true);
        };

        this.signallingServer.onRemove = (client) => {
            this.removeClient(client);
        };

        this.signallingServer.onMessage = (message) => {
            this.receivedMessage(message);
        };

        this.signallingServer.connect();
    }

    createPeerConnection(clientId, isInitiator) {
        console.log(`#createPeerConnection(${clientId}, ${isInitiator})`);
        //wrap supplied callbacks to include clientId without having to store in datachannel
        const dataChannelOnReceivedAttribute = (att) => {
            this.onReceivedAttribute(clientId, att);
        };

        const datachannelOnUpdate = (att) => {
            this.config.fire(clientId, att);
        };

        const dataChannelOnRemoveAttribute = (attribute) => {
            this.onRemoveAttribute(clientId, attribute);
        };

        const handleIceCandidate = (event) => {
            if (event.candidate) {
                this.signallingServer.sendMessage({
                    type: 'candidate',
                    toClient: clientId,
                    fromClient: this.getId(),
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                });
            }
        };

        const receivedConnection = (conn, result) => {
            console.log("#receivedConnection");
            result.datachannel = new DataChannel(conn, dataChannelOnReceivedAttribute, datachannelOnUpdate, dataChannelOnRemoveAttribute);
            result.datachannel.on("messageTo", function (data) {
                console.log("got message: " + data.value + " from: " + clientId + ", to:" + data.toClient);
                if (this.clients[data.toClient]) {
                    this.clients[data.toClient].pc.datachannel.sendFrom(clientId, data.value);
                }
            });
            result.datachannel.on("messageFrom", function (data) {
                console.log("got message: " + data.value + ", from: " + data.from + ", through: " + clientId);
            });
            result.datachannel.on("disconnect", function () {
                this.removeClient(clientId);
            });
            this.onReceivedConnection(clientId);
            for (const attribute in this.attributes) {
                result.datachannel.addTrackedAttribute(this.attributes[attribute]);

                //add datachannel to attribute to ensure updates work
                //on attributes that were created before the datachannel
                this.attributes[attribute].addDataChannel(result.datachannel);
            }
        };

        try {
            var result = {
                peerconnection: null,
                datachannel: null
            };

            var pc = new RTCPeerConnection(null, {optional: []});
            result.peerconnection = pc;

            //ensure only 1 datachannel is opened between these 2 peers
            if (isInitiator) {
                var conn = pc.createDataChannel("testchannel", {});
                conn.onopen = function () {
                    receivedConnection(conn, result);
                };
            } else {
                pc.ondatachannel = function (event) {
                    receivedConnection(event.channel, result);
                };
            }

            pc.onicecandidate = handleIceCandidate;

            return result;
        } catch (e) {
            console.error(e);
            alert('Cannot create RTCPeerConnection object.');
        }
    }

    doCall(pc, client) {

        const setLocalAndSendMessage = (sessionDescription) => {
            pc.setLocalDescription(sessionDescription);
            const message = {
                sessionDescription: sessionDescription,
                toClient: client,
                fromClient: this.getId()
            };
            this.signallingServer.sendMessage(message);
        };
        pc.createOffer(setLocalAndSendMessage, this.handleCreateOfferError);
    }

    doAnswer(pc, client) {

        const setLocalAndSendMessage = (sessionDescription) => {
            pc.setLocalDescription(sessionDescription);
            var message = {
                sessionDescription: sessionDescription,
                toClient: client,
                fromClient: this.getId()
            };
            this.signallingServer.sendMessage(message);
        };
        pc.createAnswer(setLocalAndSendMessage, (error) => {
            console.log(error)
        }, this.sdpConstraints);
    }

    handleCreateOfferError(event) {
        console.error('createOffer() error: ', event);
    }

    getId() {
        return this.id;
    }

    addClient(clientId, isInitiator) {
        if (clientId !== this.id) {
            var pc = this.createPeerConnection(clientId, isInitiator);
            this.clients[clientId] = {
                pc: pc,
                isInitiator: isInitiator
            };
            if (isInitiator) {
                this.doCall(pc.peerconnection, clientId);
            }
        }
    }

    removeClient(clientId) {
        this.onRemovedConnection(clientId);
        delete this.clients[clientId];
    }

    getClients() {
        return this.clients;
    }

    receivedMessage(message) {
        var clientId = message.fromClient;
        var client = this.clients[clientId];
        if (!client) {
            debugger;
        }
        var type = message.type || message.sessionDescription.type;
        var success = () => {
        };
        var error = (error) => {
            console.error(error);
        };
        if (type === 'offer') {
            if (client.isInitiator) {
                this.doCall(client.pc, clientId);
            }
            client.pc.peerconnection.setRemoteDescription(
                new RTCSessionDescription(message.sessionDescription), success, error);

            this.doAnswer(client.pc.peerconnection, clientId);
        } else if (type === 'answer') {
            client.pc.peerconnection.setRemoteDescription(
                new RTCSessionDescription(message.sessionDescription), success, error);
        } else if (type === 'candidate') {
            var candidate = new RTCIceCandidate({
                sdpMLineIndex: message.label,
                candidate: message.candidate,
                sdpMid: message.id
            });
            client.pc.peerconnection.addIceCandidate(candidate, success, error);
        }
    }

    broadcast(message) {
        for (const clientId in this.clients) {
            if (this.clients.hasOwnProperty(clientId)) {
                this.clients[clientId].pc.datachannel.send(message);
            }
        }
    }

    /**
     * send a message to toId through throughId
     * @param message
     * @param throughId middleman
     * @param toId destination client
     */
    sendThroughTo(message, throughId, toId) {
        if (this.clients[throughId]) {
            this.clients[throughId].pc.datachannel.sendTo(toId, message);
        } else {
            console.error("Client" + throughId + " was not found.");
        }
    }

    removeAttribute(name) {
        console.log(`#removeAttribute(${name})`);
        const attributeToRemove = this.attributes[name];
        if (!attributeToRemove) {
            return;
        }
        attributeToRemove.signalRemove();

        delete this.attributes[name];
    }

    createAttribute(name, value) {
        console.log(`#createAttribute(${name}, ${JSON.stringify(value)})`);
        var datachannels = [];
        for (var clientId in this.clients) {
            datachannels.push(this.clients[clientId].pc.datachannel);
        }
        var attribute = new WritableTrackedAttribute(datachannels, name, value);
        this.attributes[attribute.getName()] = attribute;
        this.config.addPublish(name);
        return attribute;
    }

    getMyAttributes() {
        return this.attributes;
    }

    getTheirAttributes(theirClientId) {
        //return the provided clients attributes
        var client = this.clients[theirClientId];
        return client.pc.datachannel.getTheirAttributes();
    }

    getEveryonesAttributes() {
        //return all clients attributes
        var result = {};
        for (var clientId in this.clients) {
            var client = this.clients[clientId];
            result[clientId] = client.pc.datachannel.getTheirAttributes();
        }
        return result;
    }
}
