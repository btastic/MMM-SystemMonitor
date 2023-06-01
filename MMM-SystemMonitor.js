/* global Module */

/* Magic Mirror
 * Module: MMM-SystemMonitor
 *
 * By Ben Konsemüller
 * MIT Licensed.
 */

Module.register("MMM-SystemMonitor", {
  defaults: {
    updateInterval: 60000,
    cpuThermalZone: 0,
    units: config.units,
  },

  loading: true,

  displayData: {
    cpu_temp: null,
    available_memory: null, 
    uptime: null,
    available_space: null,
  },

  requiresVersion: "2.1.0", // Required version of MagicMirror

  start: function () {
    Log.info(`Starting module: ${this.name}`);
    this.addFilters();
    this.sendSocketNotification("CONFIG", this.config);
  },

  socketNotificationReceived: function (notification, payload) {
    switch (notification) {
      case "SYSTEM_MONITOR_DATA":
        this.loading = false;
        this.displayData = payload;
    }

    this.updateDom(this.config.animationSpeed);
  },

  getTemplate: function () {
    return "templates\\MMM-SystemMonitor.njk";
  },

  getTemplateData() {
    const templateData = {
      data: this.displayData,
      loading: this.loading
    };

    return templateData;
  },

  getScripts: function () {
    return [];
  },

  getStyles: function () {
    return [
      "MMM-SystemMonitor.css",
    ];
  },

  addFilters() {
    const env = this.nunjucksEnvironment();

    env.addFilter("uptime", this.uptimeFormat.bind(this));
    env.addFilter("convertTemperature", this.convertTemperature.bind(this));
  },

  uptimeFormat(uptimeInSeconds) {
    return moment.utc(1000 * uptimeInSeconds).format('HH[h] mm[m] ss[s]');
  },

  convertTemperature(temperature) {
    switch(this.config.units) {
      case "metric":
        return `${Math.round(temperature / 1000)}°C`;
      case "imperial":
        return `${Math.round(((temperature * 1.8) + 32) / 1000)}°F`;
      default:
        return `${Math.round(temperature / 1000)}°C`;
    }
  },

  getTranslations: function () {
    return {
      en: "translations/en.json",
      de: "translations/de.json",
    };
  },
});
