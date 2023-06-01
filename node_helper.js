/* Magic Mirror
 * Node Helper: MMM-SystemMonitor
 *
 * By Ben Konsemüller
 * MIT Licensed.
 */

const Log = require("logger");
const NodeHelper = require("node_helper");

const util = require('util');
const exec = util.promisify(require('child_process').exec);

module.exports = NodeHelper.create({
  config: {},
  currentFile: null,
  async socketNotificationReceived(notification, payload) {
    if (notification === "CONFIG") {
      this.config = payload;

      if (this.fetchTimerId) {
        clearTimeout(this.fetchTimerId);
      }

      await this.fetchData();
    }
  },

  async fetchData() {
    const self = this;

    const cpu_temp = await this.getCpuTemperature();
    const available_memory = await this.getAvailableMemoryPercentage();
    const uptime = await this.getUptimeSeconds();
    const available_space = await this.getAvailableSpacePercentage();

    this.sendSocketNotification("SYSTEM_MONITOR_DATA", { cpu_temp, available_memory, uptime, available_space });

    this.fetchTimerId = setTimeout(async function () {
      await self.fetchData();
    }, this.config.updateInterval);
  },

  async getCpuTemperature() {
    return await this.exec(`cat /sys/class/thermal/thermal_zone${this.config.cpuThermalZone}/temp`);
  },

  async getAvailableMemoryPercentage() {
    return await this.exec("free | awk '/^Mem/ { print (($4+$7)/$2 * 100) }'");
  },

  async getUptimeSeconds() {
    const result = await this.exec("cat /proc/uptime");

    if (!result) {
      return null;
    }

    return result.split(" ")[0];
  },

  async getAvailableSpacePercentage() {
    return await this.exec("df | awk '$6 == \"/\" {print $5}'");
  },

  async exec(cmd) {
    const { stdout, stderr } = await exec(cmd);

    if (stderr) {
      Log.error(`${this.name} - Error getting data. Command: ${cmd}`)
      return null;
    }

    return stdout;
  }
});
