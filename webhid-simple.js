let device = null;

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

function onInputReport(event) {
  console.log("Got an input report:", event);
  let reportId = event.reportId;
  let reportData = event.data;

  let buf = "";
  for (let i = 0; i < reportData.byteLength; ++i) {
    buf += ' ' + hexByte(reportData.getUint8(i));
  }

  logappend('Device reported input (RAW) with report ID "' + hexByte(reportId) + '": ' + buf);
}

async function requestDevice() {
  if (!navigator.hid) {
    logappend('navigator.hid is not defined - Use Chrome 78+ and enable feature flag');
    return;
  }

  const vendor = document.getElementById('vendor').value;
  const filters = [];
  if (vendor) {
    filters.push({vendorId: vendor});
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

  // Register an input report event listener.
  device.oninputreport = onInputReport;

  logappend('Connected to device: ' + device.productName);
}

