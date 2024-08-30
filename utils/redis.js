import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    this.connected = true;
    this.client.on('error', (err) => {
      console.log(`Unable to connect to redis server: ${err}`);
      this.connected = false;
    });
    this.client.on('ready', () => {
      this.connected = true;
    });
  }

  isAlive() {
    return this.connected;
  }

  async get(key) {
    this.client.get = promisify(this.client.get);
    return this.client.get(key);
  }

  async set(key, value, duration) {
    this.client.setex = promisify(this.client.setex);
    await this.client.setex(key, duration, value);
  }

  async del(key) {
    this.client.del = promisify(this.client.del);
    await this.client.del(key);
  }
}

const redisClient = new RedisClient();

export default redisClient;
