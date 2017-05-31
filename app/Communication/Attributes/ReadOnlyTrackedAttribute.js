/**
 * Created by rossbille on 18/05/2015.
 */

export default class ReadOnlyTrackedAttribute {
    constructor(datachannel,
                name,
                value,
                onupdate) {
        this.datachannel = datachannel;
        this.name = name;
        this.value = value;
        this.onupdate = onupdate;
    }

    getName() {
        return this.name;
    }

    getValue() {
        return this.value;
    }

    updated() {
        console.log("#updated()");
        const oldVal = this.value;
        console.log(oldVal);
        console.log("about to try and fetch my latest value");
        console.log(this);
        const newVal = this.datachannel.getLatestValue(this);
        console.log(newVal);
        if (oldVal !== newVal) {
            this.value = newVal;
            console.log("firing update event");
            this.onupdate(this);
        }
    }
}