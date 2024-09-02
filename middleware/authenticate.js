import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

const Unauthorized = { error: 'Unauthorized' };

export default async function authenticate(req, res, next) {
  const { 'x-token': token } = req.headers;
  const key = `auth_${token}`;
  if (!token) {
    return res.status(401).json(Unauthorized);
  }
  const id = await redisClient.get(key);
  if (!id) {
    return res.status(401).json(Unauthorized);
  }
  const user = await dbClient.users.findOne({ _id: new ObjectId(id) });
  if (!user) {
    return res.status(401).json(Unauthorized);
  }
  req.user = user;
  return next();
}
