import Bull from 'bull';
import dbClient from '../utils/db';
import { checkUser, hashPassword } from '../utils/auth';

const userQueue = new Bull('userQueue');

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
  await userQueue.add({ userId: newUser.insertedId.toString() });
  return res.status(201).json({ id: newUser.insertedId, email });
}

export async function getMe(req, res) {
  const { user } = req;
  return res.json({ id: user._id, email: user.email });
}
