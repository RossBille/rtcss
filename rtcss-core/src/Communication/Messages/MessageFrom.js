/**
 * Created by rossbille on 24/05/2015.
 */
import Message from "./Message";
export default class MessageFrom extends Message {
    constructor(from, message) {
        super(message);
        this.fromClient = from;
    }

    toJSON() {
        return {
            type: "messageFrom",
            from: this.fromClient,
            value: this.getValue()
        };
    }
}