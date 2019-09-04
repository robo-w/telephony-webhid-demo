# WebHID demo for the telephony headsets

A demo that connects to a USB headsets, including Bluetooth headsets that include USB dongles

[WebHID API specification](https://wicg.github.io/webhid/index.html)


## Browser requirements

WebHID is available in Chrome 78+ behind a flag. To use WebHID, navigate to chrome://flags in a browser window and enable "Experimental Web Platform Features", then restart Chrome.

## Usage

* Plug the headset into a USB port.
* Open the [demo page](https://nondebug.github.io/jabra-webhid-demo/) and click the Connect button.
* Optionally enter a vendor ID filter
* In the device chooser dialog, select the headset
* Check that a "Connected to device" message is displayed.

After connecting to the headset, try clicking the "Pick Up" button to send an output report. This will cause LEDs to light up on the headset and control unit. The headset should respond with HID input reports. You can also press buttons on the control unit/headset to cause the headset to send HID input reports.
