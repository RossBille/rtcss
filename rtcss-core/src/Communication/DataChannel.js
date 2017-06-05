/**
 * Created by rossbille on 18/05/2015.
 */

import xMessage from "./Messages/Message";
import ReadOnlyTrackedAttribute from "./Attributes/ReadOnlyTrackedAttribute";
import MessageFrom from "./Messages/MessageFrom";


function isAttributeName(attribute, name) {
    return name === attribute.getName();
}

class DataChannel {
    constructor(conn, onReceivedAttribute, onUpdate, onRemoveAttribute) {
        this.conn = conn;
        this.onReceivedAttribute = onReceivedAttribute;
        this.onUpdate = onUpdate;
        this.onRemoveAttribute = onRemoveAttribute;
        this.trackedAttributes = [];
        this.values = {};
        this.events = {
            message: (data) => {
                console.log("Message: " + data.value);
            },
            update: (data) => {
                console.log("got update event");
                console.log(data);
                console.log(this.values);
                this.values[data.name] = data.value;
                console.log(this.values);

                console.log("tracked attributes:");
                console.log(this.trackedAttributes);
                this.trackedAttributes.forEach((element) => {
                    if (data.name === element.getName()) {
                        console.log("found element to update.");
                        element.updated();
                    }
                });
            },
            create: (data) => {
                console.log("Got create event");
                console.log(data);
                const trackedAttribute = new ReadOnlyTrackedAttribute(this, data.name, data.value, onUpdate);
                this.trackedAttributes.push(trackedAttribute);
                this.values[trackedAttribute.getName()] = trackedAttribute.getValue();
                onReceivedAttribute(trackedAttribute);
            },
            remove: ({name}) => {
                console.log("Got remove event");
                const attributeToRemove = this.trackedAttributes.filter(attribute => isAttributeName(attribute, name))[0];
                this.trackedAttributes = this.trackedAttributes.filter(attribute => !isAttributeName(attribute, name));
                if (attributeToRemove) {
                    this.onRemoveAttribute(attributeToRemove);
                }
            }
        };

        conn.onmessage = (message) => {
            const data = JSON.parse(message.data);
            if (this.events[data.type]) {
                this.events[data.type](data);
            } else {
                console.error("Unexpected message received.", message, data);
            }
        }
    }

    /**
     * add event listener to this DataChannel
     * @param event the event to listen to
     * @param callback the function to fire when the event occurs
     */
    on(event, callback) {
        this.events[event] = callback;
    }

    getLatestValue(attribute) {
        return this.values[attribute.getName()];
    }

    removeTrackedAttribute(attribute) {
        this.conn.send(JSON.stringify({
            type: "remove",
            name: attribute.getName()
        }));
    }

    addTrackedAttribute(attribute) {
        console.log(attribute);
        const message = {
            type: "create",
            name: attribute.getName(),
            value: attribute.getValue()
        };
        this.conn.send(JSON.stringify(message));
    }

    /**
     * use this client to send message to their client with the corresponding id
     * @param clientId the destination client
     * @param message
     */
    sendTo(clientId, message) {
        this.conn.send(JSON.stringify(
            new MessageTo(clientId, message))
        );
    }

    /**
     * send a message to this client that was received from another client
     * @param message
     * @param from the source of this message
     */
    sendFrom(from, message) {
        this.conn.send(JSON.stringify(
            new MessageFrom(from, message))
        );
    }

    /**
     * send a message to this client
     * @param message
     */
    send(message) {
        this.conn.send(JSON.stringify(
            new Message(message))
        );
    }

    update(attribute) {
        if (this.conn.readyState === "open") {
            console.log("connection is open");
            console.log(this.conn);
            this.conn.send(JSON.stringify({
                type: "update",
                name: attribute.getName(),
                value: attribute.getValue()
            }));
        } else {
            console.error("DataChannel.update(). conn not open.", this.conn);
        }
    }

    fire(event, data) {
        if (this.conn.readyState === "open") {
            this.conn.send(JSON.stringify({
                type: event,
                data: data
            }));
        } else {
            console.error("DataChannel.fire(). conn not open.", this.conn);
        }
    }

    getTheirAttributes() {
        return this.trackedAttributes;
    }
}

export default DataChannel;
