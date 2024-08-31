import redisClient from '../utils/redis';
import dbClient from '../utils/db';

export function getStatus(req, res) {
  const status = { redis: false, db: false };
  if (redisClient.isAlive()) {
    status.redis = true;
  }
  if (dbClient.isAlive()) {
    status.db = true;
  }
  return res.json(status);
}

export async function getStats(req, res) {
  const stats = {
    users: await dbClient.nbUsers(),
    files: await dbClient.nbFiles(),
  };
  return res.json(stats);
}
