import { createHash } from 'crypto';
import dbClient from './db';

async function checkUser(email) {
  if (!email) {
    return null;
  }
  const user = await dbClient.users.findOne({ email });
  return user;
}

function hashPassword(password) {
  return createHash('sha1').update(password).digest('hex');
}

export { checkUser, hashPassword };
