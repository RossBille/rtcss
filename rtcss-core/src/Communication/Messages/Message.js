/**
 * Created by rossbille on 24/05/2015.
 */
export default class Message {
    constructor(message) {
        this.value = message;
    }

    toJSON(){
        return {
            type: "message",
            value: this.value
        };
    }

    getValue() {
        return this.value;
    }
}
