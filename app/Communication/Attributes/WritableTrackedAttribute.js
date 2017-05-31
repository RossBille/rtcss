/**
 * Created by rossbille on 22/05/2015.
 */
export default class WritableTrackedAttribute {
    constructor(datachannels, name, value) {
        this.datachannels = datachannels;
        this.name = name;
        this.value = value;

        this.validate(datachannels, name, value);
        console.log(datachannels);
        this.datachannels.forEach((datachannel) => {
            datachannel.addTrackedAttribute(this);
        });

        if (typeof this.value === "object" && this.value !== null) {
            if (Object.observe) {
                Object.observe(this.value, this.update.bind(this));
            }
            // needed to explicitly bind "this" instance when Object calls update()
            // see https://github.com/Microsoft/TypeScript/wiki/%27this%27-in-TypeScript
        }
    }

    update(){
        console.log("#update()");
        console.log(`datachannels to send to: ${JSON.stringify(this.datachannels)}`);
        console.log(this.datachannels);
        this.datachannels.forEach((datachannel) => {
            datachannel.update(this);
        });
    }

    addDataChannel(datachannel) {
        this.datachannels.push(datachannel);
    }

    removeDataChannel(datachannel) {
        this.datachannels.remove(datachannel);
    }

    getName() {
        return this.name;
    }

    getValue() {
        return this.value;
    }

    setValue(val) {
        console.log(`settingValue(${JSON.stringify(val)})`);
        this.value = val;
        if (typeof this.value === "object" && this.value !== null) {
            console.log("is typeof object");
            Object.observe(this.value, this.update);
        }
        this.update();
    }

    validate(datachannels, name, value) {
        if (name === null) {
            throw new Error("name must not be null");
        }
    }
}
