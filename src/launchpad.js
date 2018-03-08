/**
 * Representation of a single launchpad pad, containing X Y coordinates.
 */
class Pad {
	constructor(row, column) {
		if (row < 1) {
			row = 1;
		}

		if (row > 8) {
			row = 8;
		}

		if (column < 1) {
			column = 1;
		}

		if (column > 9) {
			column = 9;
		}

		this.row = row;
		this.column = column;
	}

	equals(otherPad) {
		return this.row === otherPad.row && this.column === otherPad.column;
	}
}

/**
 * Representation of a pad color, contains green and red values.
 */
class Color {
	constructor(green, red, flashing = false) {
		if (green < 0) {
			green = 0;
		}

		if (green > 3) {
			green = 3;
		}

		if (red < 0) {
			red = 0;
		}

		if (red > 3) {
			red = 3;
		}

		this.green = green;
		this.red = red;
		this.flashing = flashing;
	}

	equals(otherColor) {
		return this.green === otherColor.green && this.red === otherColor.red;
	}
}

/**
 * The main launchpad interface.
 */
class Launchpad {
	constructor(inputPort, outputPort) {
		this.inputPort = inputPort;
		this.outputPort = outputPort;

		this.inputPort.onmidimessage = this.handleMidiMessage.bind(this);

		this.listeners = {
			onPadPress: [],
			onPadRelease: [],
			onControlPadPress: [],
			onControlPadRelease: []
		};
	}

	colorToVelocity(color) {
		// TODO: double buffering
		return (color.flashing ? 8 : 12) | (color.green << 4) | color.red;
	}

	// -- SENDING --

	send(bytes) {
		this.outputPort.send(bytes);
	}

	ledOn(pad, color) {
		const row = pad.row,
			column = pad.column;

		const noteNumber = (row - 1) * 0x10 + (column - 1);

		this.send([0x90, noteNumber, this.colorToVelocity(color)]);
	}

	ledOff(pad) {
		const row = pad.row,
			column = pad.column;

		const noteNumber = (row - 1) * 0x10 + (column - 1);
		this.send([0x80, noteNumber, 0x00]);
	}

	controlLedOn(column, color) {
		if (column < 1) {
			column = 1;
		}

		if (column > 8) {
			column = 8;
		}

		const ccNumber = 0x67 + column;

		this.send([0xb0, ccNumber, this.colorToVelocity(color)]);
	}

	controlLedOff(column) {
		if (column < 1) {
			column = 1;
		}

		if (column > 8) {
			column = 8;
		}

		const ccNumber = 0x67 + column;
		this.send([0xb0, ccNumber, 0x00]);
	}

	clear() {
		this.send([0xb0, 0x00, 0x00]);
	}

	setXYMappingMode() {
		this.send([0xb0, 0x00, 0x01]);
	}

	setDrumMappingMode() {
		this.send([0xb0, 0x00, 0x02]);
	}

	enableFlashing() {
		const flash = 0x08;
		const doubleBufferConfig = 0x20 | flash;
		this.send([0xb0, 0x00, doubleBufferConfig]);
	}

	disableFlashing() {
		const flash = 0x00;
		const doubleBufferConfig = 0x20 | flash;
		this.send([0xb0, 0x00, doubleBufferConfig]);
	}

	// -- RECEIVING --

	handleMidiMessage(event) {
		if (event.data.length !== 3) {
			console.log('Unknown message received.', event.data);
		}
		else if (event.data[0] === 0xb0 && event.data[2] === 0x7f) {
			// Control Pad press
			this.listeners.onControlPadPress.forEach(callback => callback(event.data[1] - 0x67));
		}
		else if (event.data[0] === 0xb0 && event.data[2] === 0x0) {
			// Control Pad release
			this.listeners.onControlPadRelease.forEach(callback => callback(event.data[1] - 0x67));
		}
		else if (event.data[0] === 0x90 && event.data[2] === 0x7f) {
			// Pad press
			const row = Math.floor(event.data[1] / 0x10) + 1;
			const column = event.data[1] % 0x10 + 1;
			this.listeners.onPadPress.forEach(callback => callback(new Pad(row, column)));
		}
		else if (event.data[0] === 0x90 && event.data[2] === 0x0) {
			// Pad release
			const row = Math.floor(event.data[1] / 0x10) + 1;
			const column = event.data[1] % 0x10 + 1;
			this.listeners.onPadRelease.forEach(callback => callback(new Pad(row, column)));
		}
	}

	onPadPress(callback) {
		this.listeners.onPadPress.push(callback);
	}

	onPadRelease(callback) {
		this.listeners.onPadRelease.push(callback);
	}

	onControlPadPress(callback) {
		this.listeners.onControlPadPress.push(callback);
	}

	onControlPadRelease(callback) {
		this.listeners.onControlPadRelease.push(callback);
	}
};

const autoDetectLaunchpad = (midiAccess, name = 'launchpad') => {
	let launchpadInput = null,
		launchpadOutput = null;

	for (let entry of midiAccess.inputs) {
		const input = entry[1];

		if (input.name.toLowerCase().indexOf(name.toLowerCase()) > -1) {
			launchpadInput = input;
		}
	}

	for (let entry of midiAccess.outputs) {
		const output = entry[1];

		if (output.name.toLowerCase().indexOf(name.toLowerCase()) > -1) {
			launchpadOutput = output;
		}
	}

	if (launchpadInput !== null && launchpadOutput !== null) {
		return new Launchpad(launchpadInput, launchpadOutput);
	}
};
