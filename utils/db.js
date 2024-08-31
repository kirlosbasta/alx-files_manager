import { MongoClient } from 'mongodb';

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || '27017';
    this.databases = process.env.DB_DATABASE || 'files_manager';
    this.client = new MongoClient(`mongodb://${this.host}:${this.port}`);
    this.connected = false;
    // this.client.on('');
    this.client
      .connect()
      .then(() => {
        this.connected = true;
        this.databases = this.client.db(this.databases);
        this.users = this.databases.collection('users');
        this.files = this.databases.collection('files');
      })
      .catch(() => {
        this.connected = false;
      });
  }

  isAlive() {
    return this.connected;
  }

  async nbUsers() {
    return this.users.countDocuments();
  }

  async nbFiles() {
    return this.files.countDocuments();
  }
}

const dbClient = new DBClient();

export default dbClient;
