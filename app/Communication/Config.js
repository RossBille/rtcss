/**
 * Created by rossbille on 25/05/2015.
 */
export default class Config {
    constructor(publishes, subscribes) {
        this.publish = publishes;
        this.subscribe = subscribes;
    }

    fire(clientId, attribute) {
        if (this.subscribe.hasOwnProperty(attribute.getName())) {
            this.subscribe[attribute.getName()](clientId, attribute);
        } else {
            console.log("Not subscribed to this attribute.");
        }
    }

    addPublish(event) {
        this.publish.push(event);
    }

    getPublishes() {
        return this.publish;
    }
}