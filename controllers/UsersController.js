import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { checkUser, hashPassword } from '../utils/auth';

const Unauthorized = { error: 'Unauthorized' };

export async function postNew(req, res) {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!password) {
    return res.status(400).json({ error: 'Missing password' });
  }
  const user = await checkUser(email);
  if (user) {
    return res.status(400).json({ error: 'Already exist' });
  }
  const hashedPassword = hashPassword(password);
  const newUser = await dbClient.users.insertOne({
    email,
    password: hashedPassword,
  });
  return res.status(201).json({ id: newUser.insertedId, email });
}

export async function getMe(req, res) {
  const { 'x-token': token } = req.headers;
  const key = `auth_${token}`;
  if (!token) {
    return res.status(401).json(Unauthorized);
  }
  const id = await redisClient.get(key);
  if (!id) {
    return res.status(401).json(Unauthorized);
  }
  const user = await dbClient.users.findOne(
    { _id: new ObjectId(id) },
    { projection: { password: 0 } },
  );
  if (!user) {
    return res.status(401).json(Unauthorized);
  }
  return res.json(user);
}
