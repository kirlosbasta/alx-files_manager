import { v4 } from 'uuid';
import redisClient from '../utils/redis';
import { parseAuthorization, comparePasswords, checkUser } from '../utils/auth';

const Unauthorized = { error: 'Unauthorized' };

export async function getConnect(req, res) {
  // should provide basic style authorization <email>:<password>
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json(Unauthorized);
  }
  // convert base64 string to email and password
  const [email, password] = parseAuthorization(authorization);
  if (!email || !password) {
    return res.status(401).json(Unauthorized);
  }
  // get the user by email and check the password
  const user = await checkUser(email);
  if (!user) {
    return res.status(401).json(Unauthorized);
  }
  if (!comparePasswords(password, user.password)) {
    return res.status(401).json(Unauthorized);
  }
  // cache the user id using auth_<token> as key for a day
  const token = v4();
  const key = `auth_${token}`;
  await redisClient.set(key, user._id.toString(), 60 * 60 * 24);
  return res.json({ token });
}

export async function getDisconnect(req, res) {
  const { 'x-token': token } = req.headers;
  const key = `auth_${token}`;
  await redisClient.del(key);
  return res.status(204).send();
}
