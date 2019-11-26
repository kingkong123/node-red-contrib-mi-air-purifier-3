const miio = require('miio');

const MIN = 1000 * 60;

module.exports = function(RED) {
  class MiotAirpurifier {
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
        try {
          await this.connect();
        } catch ({ message }) {
          this.warn(`Error: ${message}`);
          console.log(`Error: ${message}`);
        }
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
          await this.getStatus();
        }, 3000);
      } else {
        await this.getStatus();
      }
    }

    async nodeStart() {
      this.createTimer();
    }

    connect() {
      return new Promise(async (resolve, reject) => {
        try {
          const device = await miio.device({
            address: this.config.ip,
            token: this.config.token
          });

          this.device = device;
          this.did = device.handle.api.id;

          this.status({});

          resolve(device);
        } catch (err) {
          this.warn('Miot Airpurifier Error: ' + err.message);
          this.status({ fill: 'red', shape: 'ring', text: err.message });
          reject(err);
        }
      });
    }

    async createTimer() {
      try {
        await this.getStatus();

        this.refreshStatusTimer = setInterval(async () => {
          await this.getStatus();
        }, MIN * 15);
      } catch ({ message }) {
        setTimeout(async () => {
          this.refreshTimer();
        }, MIN);
      }
    }

    async refreshTimer() {
      if (this.refreshStatusTimer) {
        clearInterval(this.refreshStatusTimer);
        this.refreshStatusTimer = null;
      }

      await this.createTimer();
    }

    async getStatus() {
      if (!this.device) {
        try {
          await this.connect();
        } catch ({ message }) {
          this.warn(`Error: ${message}`);
          console.log(`Error: ${message}`);
        }
      }

      return new Promise(async (resolve, reject) => {
        if (this.device) {
          try {
            const values = await this.device.loadProperties([
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
              payload: values
            });

            this.status({});

            resolve(true);
          } catch (err) {
            console.log('Encountered an error while controlling device');
            console.log('Error(2) was:');
            console.log(err.message);
            reject(err);
          } finally {
            if (this.device) {
              this.device.destroy();
              this.device = null;
            }
          }
        }
      });
    }
  }

  RED.nodes.registerType('miot-airpurifier', MiotAirpurifier, {});
};
