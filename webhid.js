let mode = "auto";
let device = null;
let outputs = {};
let inputs = {};

const modes = { // List of supported vendors and their HID Report layout
  "jabra": {
    "vendorId": 0x0b0e,
    "inputs": {
      "telephony-hook": {"reportId": 2, "reportPos": 0},
      "telephony-mute": {"reportId": 2, "reportPos": 2},
      "telephony-flash": {"reportId": 2, "reportPos": 3},
      "telephony-redial": {"reportId": 2, "reportPos": 4},
      "telephony-button": {"reportId": 2, "reportPos": 6},
    },
    "outputs": {
      "led-offhook": {"reportId": 2, "reportPos": 0},
      "led-mute": {"reportId": 2, "reportPos": 1},
      "led-ring": {"reportId": 2, "reportPos": 2},
      "led-hold": {"reportId": 2, "reportPos": 3},
      "led-microphone": {"reportId": 2, "reportPos": 4},
      "telephony-ringer": {"reportId": 2, "reportPos": 5},
    }
  },
  "poly": {
    "vendorId": 0x047f,
    "inputs": {
      "telephony-hook": {"reportId": 1, "reportPos": 0},
      "telephony-flash": {"reportId": 1, "reportPos": 2},
      "telephony-redial": {"reportId": 1, "reportPos": 3},
      "telephony-mute": {"reportId": 1, "reportPos": 1},
      "telephony-drop": {"reportId": 3, "reportPos": 4},
      "telephony-button": {"reportId": 1, "reportPos": 4},
      "buttons-one": {"reportId": 1, "reportPos": 5},
    },
    "outputs": {
      "telephony-ringer": {"reportId": 3, "reportPos": 0},
      "led-offhook": {"reportId": 4, "reportPos": 0},
      "led-microphone": {"reportId": 3, "reportPos": 2},
      "led-ring": {"reportId": 1, "reportPos": 0},
      "led-mute": {"reportId": 3, "reportPos": 0},
      "led-online": {"reportId": 3, "reportPos": 5},
      "led-hold": {"reportId": 5, "reportPos": 0},
    }
  },
  "sennheiser": {
    "vendorId": 0x1395,
    "inputs": {
      "telephony-hook": {"reportId": 3, "reportPos": 0},
      "telephony-flash": {"reportId": 3, "reportPos": 1},
      "telephony-redial": {"reportId": 3, "reportPos": 2},
      "telephony-mute": {"reportId": 3, "reportPos": 3},
      "telephony-drop": {"reportId": 3, "reportPos": 4},
      "telephony-button": {"reportId": 3, "reportPos": 5},
      "buttons-one": {"reportId": 3, "reportPos": 6},
    },
    "outputs": {
      "telephony-ringer": {"reportId": 3, "reportPos": 0},
      "led-offhook": {"reportId": 3, "reportPos": 1},
      "led-microphone": {"reportId": 3, "reportPos": 2},
      "led-ring": {"reportId": 3, "reportPos": 3},
      "led-mute": {"reportId": 3, "reportPos": 4},
      "led-online": {"reportId": 3, "reportPos": 5},
      "led-hold": {"reportId": 3, "reportPos": 6},
    }
  },
}

const outputMap = { // List of supported output reports
  0x08: {
    0x09: 'led-mute',
    0x17: 'led-offhook',
    0x18: 'led-ring',
    0x20: 'led-hold',
    0x21: 'led-microphone',
    0x2a: 'led-online'
  },
  0x0b: {
    0x9e: 'telephony-ringer'
  }
}

const inputMap = { // List of supported input reports
  0x0b: {
    0x07: 'telephony-button',
    0x20: 'telephony-hook',
    0x21: 'telephony-flash',
    0x24: 'telephony-redial',
    0x26: 'telephony-drop',
    0x2f: 'telephony-mute',
  },
  0x09: {
    0x01: 'buttons-one'
  }
}

function logappend(msg) {
  console.log(msg);
  const mylog = document.getElementById('mylog');
  const line = document.createElement('div');
  line.textContent = msg;
  mylog.appendChild(line);
}

function hexByte(d) {
  let hex = Number(d).toString(16);
  while (hex.length < 2)
    hex = "0" + hex;
  return hex;
}

function pickUp() {
  if (!device || !device.opened) {
    logappend('Connect first!');
    return;
  }
  document.getElementById('led-off-hook').checked = true;
  document.getElementById('led-ring').checked = false;
  document.getElementById('ringer').checked = false;
  sendOutputReport();
}

function ring() {
  if (!device || !device.opened) {
    logappend('Connect first!');
    return;
  }
  document.getElementById('led-ring').checked = true;
  document.getElementById('ringer').checked = true;
  sendOutputReport();
}

function toggleMute() {
  if (!device || !device.opened) {
    logappend('Connect first!');
    return;
  }
  let element = document.getElementById('led-mute');
  element.checked = !element.checked;
  element = document.getElementById('led-microphone');
  element.checked = !element.checked;
  sendOutputReport();
}

function toggleHold() {
  if (!device || !device.opened) {
    logappend('Connect first!');
    return;
  }
  let element = document.getElementById('led-hold');
  element.checked = !element.checked;
  sendOutputReport();
}

function hangUp() {
  if (!device || !device.opened) {
    logappend('Connect first!');
    return;
  }
  document.getElementById('led-off-hook').checked = false;
  document.getElementById('led-mute').checked = false;
  document.getElementById('led-microphone').checked = false;
  document.getElementById('led-ring').checked = false;
  document.getElementById('led-hold').checked = false;
  document.getElementById('ringer').checked = false;
  sendOutputReport();
}

function sendOutputReport() {
  if (!device || !device.opened)
    return;
  let ledOffHook = document.getElementById('led-off-hook').checked;
  let ledMute = document.getElementById('led-mute').checked;
  let ledRing = document.getElementById('led-ring').checked;
  let ledHold = document.getElementById('led-hold').checked;
  let ledMicrophone = document.getElementById('led-microphone').checked;
  let ringer = document.getElementById('ringer').checked;
  let bits = {}
  for (k in outputs) { // Initials output buffers for reports with configured usages
    if (!(outputs[k].reportId in bits)) {
      bits[outputs[k].reportId] = 0
    }
  }

  if ('led-offhook' in outputs) bits[outputs['led-offhook'].reportId] |= ledOffHook << outputs['led-offhook'].reportPos;
  if ('led-mute' in outputs) bits[outputs['led-mute'].reportId] |= ledMute << outputs['led-mute'].reportPos;
  if ('led-ring' in outputs) bits[outputs['led-ring'].reportId] |= ledRing << outputs['led-ring'].reportPos;
  if ('led-microphone' in outputs) bits[outputs['led-microphone'].reportId] |= ledMicrophone << outputs['led-microphone'].reportPos;
  if ('telephony-ringer' in outputs) bits[outputs['telephony-ringer'].reportId] |= ringer << outputs['telephony-ringer'].reportPos;

  // TODO: Only add something to the buffer for the particular output report it'll go to
  let buf = '';
  if (ledOffHook)
    buf += ' off-hook-led';
  if (ledMute)
    buf += ' mute-led';
  if (ledRing)
    buf += ' ring-led';
  if (ledHold)
    buf += ' hold-led';
  if (ledMicrophone)
    buf += ' microphone-led';
  if (ringer)
    buf += ' ringer';

  for (let k in bits) {
    logappend('OUTPUT (' + k + '):' + buf);
    // Send the report to the device.
    device.sendReport(k, new Uint8Array([bits[k], 0x00]));
  }
}

function onInputReport(event) {
  let reportId = event.reportId;
  let reportData = event.data;
  let handle = false;
  // Find usages applicable to the incoming report
  for (let k in inputs) {
    if (inputs[k].reportId === reportId) {
      handle = true;
      let value = reportData.getUint8(0) & (1 << inputs[k].reportPos);
      switch (k) {
        case 'telephony-hook':
          hookSwitch = value;
          break;
        case 'telephony-mute':
          phoneMute = value;
          break;
        case 'telephony-flash':
          flash = value;
          break;
        case 'telephony-redial':
          redial = value;
          break;
      }
    }
  }
  let buf = '';
  if (handle) {
    document.getElementById('hook-switch').checked = hookSwitch;
    document.getElementById('phone-mute').checked = phoneMute;
    document.getElementById('flash').checked = flash;
    document.getElementById('redial').checked = redial;

    if (hookSwitch) {
      buf += ' off-hook';
      if (!document.getElementById('led-off-hook').checked) {
        pickUp();
      }
    } else {
      buf += ' on-hook';
      if (document.getElementById('led-off-hook').checked) {
        hangUp();
      }
    }
    if (phoneMute) {
      buf += ' mute';
      document.getElementById('led-mute').checked = !document.getElementById('led-mute').checked;
      document.getElementById('led-microphone').checked = !document.getElementById('led-microphone').checked;
      sendOutputReport();
    }
    if (flash)
      buf += ' flash';
    if (redial)
      buf += ' redial';
    logappend('INPUT ' + hexByte(reportId) + ': ' + buf);
  } else {
    for (let i = 0; i < reportData.byteLength; ++i)
      buf += ' ' + hexByte(reportData.getUint8(i));
    logappend('INPUT (RAW) ' + hexByte(reportId) + ': ' + buf);
  }
}

async function requestDevice() {
  if (!navigator.hid) {
    logappend('navigator.hid is not defined - Use Chrome 78+ and enable feature flag');
    return;
  }

  // Show a device chooser dialog. Use the vendor ID filter depending on mode
  const vendor = document.getElementById('vendor').value;
  mode = document.getElementById('mode').value;
  const filters = [];
  if (vendor) {
    filters.push({vendorId: vendor});
  } else if (mode !== "auto") {
    filters.push({vendorId: modes[mode].vendorId});
  }

  try {
    const devices = await navigator.hid.requestDevice({filters: filters});
    if (!devices || devices.length < 1) {
      logappend('chooser dismissed without a selection');
      return;
    }

    console.log("Got requested devices:", devices)
    device = devices[0];
  } catch (error) {
    logappend('Failed to request devices.');
    console.warn('Failed to request devices.', error);
  }

  // Open the device.
  await device.open();
  if (!device.opened) {
    logappend('open failed');
    return;
  }
  if (mode === "auto") {
    enumerateReports();
  }

  // Register an input report event listener.
  device.oninputreport = onInputReport;

  // Enable output report buttons.
  document.getElementById('button-pick-up').disabled = false;
  document.getElementById('button-ring').disabled = false;
  document.getElementById('button-toggle-mute').disabled = false;
  document.getElementById('button-toggle-hold').disabled = false;
  document.getElementById('button-hang-up').disabled = false;

  logappend('Connected to device: ' + device.productName);
}

function changeMode() {
  mode = document.getElementById('mode').value;
  vendorFilter = document.getElementById('vendorFilter');
  if (mode === "auto") {
    inputs = null;
    outputs = null;
    vendorFilter.style.display = "block";
  } else {
    inputs = modes[mode].inputs;
    outputs = modes[mode].outputs;
    vendorFilter.style.display = "none";
  }
  updateDetailDisplay();
}

function updateDetailDisplay() {
  const dInputReportDetails = document.getElementById('dInputReportDetails');
  const dOutputReportDetails = document.getElementById('dOutputReportDetails');
  let buf = "";
  for (let k in inputs) {
    buf += "\"" + k + "\":{" + " \"reportId\": " + inputs[k].reportId + ", \"reportPos\": " + inputs[k].reportPos + "},<br/>";
  }
  dInputReportDetails.innerHTML = buf;
  buf = "";
  for (let k in outputs) {
    buf += "\"" + k + "\":{" + " \"reportId\": " + outputs[k].reportId + ", \"reportPos\": " + outputs[k].reportPos + "},<br/>";
  }
  dOutputReportDetails.innerHTML = buf;
}

function enumerateReports() {
  var telephonyCollection = null;
  for (x = 0; x < device.collections.length; x++) {
    if (device.collections[x].usagePage === 0x0b) {
      telephonyCollection = device.collections[x];
      break;
    }
  }
  if (!telephonyCollection) {
    logappend("Couldn't find telephony collection, unsupported device");
  }

  for (q = 0; q < telephonyCollection.outputReports.length; q++) {
    reportPos = 0;
    for (x = 0; x < telephonyCollection.outputReports[q].items.length; x++) {
      for (y = 0; y < telephonyCollection.outputReports[q].items[x].usages.length; y++) {
        usagePage = (telephonyCollection.outputReports[q].items[x].usages[y] & 0xFF0000) >> 16
        usage = (telephonyCollection.outputReports[q].items[x].usages[y] & 0x0000FF)
        if (usagePage in outputMap) {
          if (usage in outputMap[usagePage]) {
            outputs[outputMap[usagePage][usage]] = {
              "reportId": telephonyCollection.outputReports[q].reportId,
              "reportPos": reportPos
            }
          }
        }
        reportPos += telephonyCollection.outputReports[q].items[x].reportSize;
      }
    }
  }
  for (q = 0; q < telephonyCollection.inputReports.length; q++) {
    reportPos = 0;
    for (x = 0; x < telephonyCollection.inputReports[q].items.length; x++) {
      for (y = 0; y < telephonyCollection.inputReports[q].items[x].usages.length; y++) {
        usagePage = (telephonyCollection.inputReports[q].items[x].usages[y] & 0xFF0000) >> 16
        usage = (telephonyCollection.inputReports[q].items[x].usages[y] & 0x0000FF)
        if (usagePage in inputMap) {
          if (usage in inputMap[usagePage]) {
            inputs[inputMap[usagePage][usage]] = {
              "reportId": telephonyCollection.inputReports[q].reportId,
              "reportPos": reportPos
            }
          }
        }
        reportPos += telephonyCollection.inputReports[q].items[x].reportSize;
      }
    }
  }
  updateDetailDisplay();
}
