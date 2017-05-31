/**
 * Created by rossbille on 24/05/2015.
 */
import Message from "./Message";

export class MessageTo extends Message {
    constructor(to, value) {
        super(value);
        this.toClient = to;
    }

    toJSON() {
        return {
            type: "messageTo",
            toClient: this.toClient,
            value: this.getValue()
        };
    }
}
