const fs = require('fs');
const fn = require('./helpers.js');
const shell = require('shelljs');
const system = require('systeminformation');


// Retrieve System Information.
function sysinfo() {
    let load = system.currentLoad((data) => { return data; });
    let mem = system.mem((data) => { return data; });
    let sysinfo = {};

    Promise.all([load, mem], (data) => {
        // Only CPU and RAM for now...
        sysinfo.cpu = data[0].currentload;
        sysinfo.ram = Math.round(100 * data[1].used / data[1].available);
        return sysinfo;
    });

}


module.exports = {
  sysinfo: sysinfo,
}
