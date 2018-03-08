# web-midi-launchpad
A Web Midi Api implementation of the Novation Launchpad functionality.

Currently supports only the old Launchpad MK1 (because that is the one I have).

> ONLY WORKS in browsers that support the web-midi-api

### Initialization
web-midi-launchpad uses (as the name suggests) the web midi api (https://webaudio.github.io/web-midi-api/).
Therefore it is required to initialize this api first by requesting midi access. Once midi access has been
granted, a launchpad instance can be created using the autoDetectLaunchpad function: 

```javascript
navigator.requestMIDIAccess().then(midiAccess => {
    const launchpad = autoDetectLaunchpad(midiAccess); //new Launchpad(inputPort.port, outputPort.port);
    launchpad.clear();
    
    // Do your stuff with launchpad
    
}, msg => {
    console.log("Failed to get MIDI access - " + msg);
});
```

It is also possible to specify a midi interface name to retrieve the inputs and outputs for
that specific midi interface:

```javascript
autoDetectLaunchpad(midiAccess, 'Launchpad S');
```

A Launchpad instance can also be created manually, specifying both input and output ports.
This can be useful if multiple launchpads are combined and the inputs of one need to work
with the outputs of another..

```javascript
new Launchpad(midiInputPort, midiOutputPort);
```

It is recommended to clear the launchpad state upon connecting to it to reset any previous state.

```javascript
launchpad.clear();
```

### Setting / Clearing LEDs
It's pretty simple to enable/disable the LEDs of the pads. web-midi-launchpad comes with two
additional interfaces to make this easy, Pad (containing X Y coordinates) and Color (containing
the green/red led values).

```javascript
const pad = new Pad(row, column);

// Make the led full green
launchpad.ledOn(pad, new Color(3, 0));

// Make the led full red
launchpad.ledOn(pad, new Color(0, 3));

// Make the led full yellow
launchpad.ledOn(pad, new Color(3, 3));

// Dim the LED to off status
launchpad.ledOff(pad);
```

> Note that row can contain a value from 1 to 8, column can contain a value from 1 to 9 (9 being the
round button located at the end of the row).

> Colors (green/red) can contain values from 0 (off) to 3 (full on).

### Control pads
The top row of buttons on the Launchpad are generally used for Automap or Live features. Those buttons
are called control pads. They work in the same way as normal pads.

```javascript
// Make the led full green
launchpad.controlLedOn(1, new Color(3, 0));

// Make the led full red
launchpad.controlLedOn(1, new Color(0, 3));

// Make the led full yellow
launchpad.controlLedOn(1, new Color(3, 3));

// Dim the LED to off status
launchpad.controlLedOff(1);
```

> The control led number can range from 1 to 8

### Led flashing
It is possible to configure the Launchpad so that it can flash specific LEDs. To enable
flashing:

```javascript
launchpad.enableFlashing();
```

Then use the Color interface to specify flashing behavior per LED:

```javascript
launchpad.controlLedOn(1, new Color(3, 0, true)); // True means flashing
```

Flashing can also be disabled.

```javascript
launchpad.disableFlashing();
```

Example 1, flashing all leds using the flashing mechanism.

```javascript
launchpad.enableFlashing();
for (let row = 1; row < 9; row++) {
    for (let column = 1; column < 10; column++) {
        launchpad.ledOn(new Pad(row, column), new Color(3, 0, true));
    }
}
```

Example 2, flashing all leds manually.

```javascript
const flashSpeed = 250;
setInterval(() => {
	for (let row = 1; row < 9; row++) {
		for (let column = 1; column < 10; column++) {
			launchpad.ledOn(new Pad(row, column), new Color(3, 0, true));
		}
	}
	setTimeout(() => {
		for (let row = 1; row < 9; row++) {
			for (let column = 1; column < 10; column++) {
				launchpad.ledOff(new Pad(row, column), new Color(3, 0, true));
			}
		}
	}, flashSpeed / 2)
}, flashSpeed);
```

### Setting mapping mode
It is possible to configure the Launchpad in one of two possible mapping modes. Drum mapping
is experimental and Pad positions change so the Pad interface might not work as expected.

```javascript
launchpad.setDrumMappingMode();
```

Default is the XY mapping mode.

```javascript
launchpad.setXYMappingMode();
```

### Handling pad presses
The pads on the Launchpad can send events when either a pad is pressed or released, it is
pretty easy to listen to those events.

```javascript
launchpad.onPadPress(pad => console.log('Pad pressed', pad));

launchpad.onPadRelease(pad => console.log('Pad released', pad));

launchpad.onControlPadPress(pad => console.log('Control pad pressed', pad));

launchpad.onControlPadRelease(pad => console.log('Control pad released', pad));

```
