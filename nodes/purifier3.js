const miio = require('miio');

module.exports = function(RED) {
  class MiiotAirpurifier {
    constructor(n) {
      RED.nodes.createNode(this, n);

      const node = this;
      this.config = n;

      this.setMaxListeners(255);
      this.on('close', () => this.onClose());
      this.on('input', msg => this.onInput(msg));

      if (this.config.ip && this.config.token) {
        node.status({});
        this.nodeStart();
      } else {
        node.status({ fill: 'red', shape: 'ring', text: 'Missing config' });
      }
    }

    onClose() {
      if (this.device) {
        this.device.destroy();
        this.device = null;
      }

      if (this.refreshStatusTimer) {
        clearInterval(this.refreshStatusTimer);
      }
    }

    async onInput(message) {
      if (!this.device) {
        console.log('NO DEVICE FOUND');
        return;
      }

      const { payload } = message;

      if (payload === null || payload === undefined) {
        return;
      }

      const { control, value } = payload;

      if (!control && !value) {
        return;
      }

      switch (control) {
        case 'power':
          if (typeof value === 'boolean') {
            await this.device.changePower(value);
          }
          break;

        case 'ledBrightness':
          // bright, dim, off
          await this.device.changeLEDBrightness(value);
          break;

        case 'mode':
          // auto, sleep, favorite, none
          await this.device.changeMode(value);
          break;

        case 'fan':
          await this.device.changeFan(value);
          break;

        case 'childLock':
          await this.device.changeChildLock(value);
          break;

        case 'buzzer':
          await this.device.changeBuzzer(value);
          break;

        default:
      }

      if (control === 'power' && value === true) {
        setTimeout(async () => {
          await this.refreshTimer();
        }, 2000);
      } else {
        await this.refreshTimer();
      }
    }

    async nodeStart() {
      try {
        const r = await this.connect();

        this.did = r.handle.api.id;

        this.createTimer();
      } catch ({ message }) {
        console.log(`nodeStart error: ${message}`);
      }
    }

    connect() {
      return new Promise(async (resolve, reject) => {
        this.miio = miio;

        try {
          const device = await miio.device({
            address: this.config.ip,
            token: this.config.token
          });

          this.device = device;

          resolve(device);
        } catch (err) {
          this.warn('Miio Airpurifier Error: ' + err.message);
          node.status({ fill: 'red', shape: 'ring', text: err.message });
          reject(err);
        }
      });
    }

    async createTimer() {
      await this.getStatus();

      this.refreshStatusTimer = setInterval(async () => {
        await this.getStatus();
      }, 60000);
    }

    async refreshTimer() {
      if (this.refreshStatusTimer) {
        clearInterval(this.refreshStatusTimer);
        this.refreshStatusTimer = null;
      }

      await this.createTimer();
    }

    getStatus() {
      return new Promise(async (resolve, reject) => {
        if (this.device !== null) {
          try {
            const device = await this.device.loadProperties([
              'mode',
              'filter1_life',
              'aqi',
              'child_lock',
              'power',
              'temperature',
              'humidity',
              'fan',
              'buzzer',
              'led_brightness'
            ]);

            this.send({
              payload: device
            });

            resolve(device);
          } catch (err) {
            console.log('Encountered an error while controlling device');
            console.log('Error(2) was:');
            console.log(err.message);
            this.connect();
            reject(err);
          }
        } else {
          this.connect();
          reject('No device');
        }
      });
    }
  }

  RED.nodes.registerType('miot-airpurifier', MiiotAirpurifier, {});
};
