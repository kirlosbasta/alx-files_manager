import { createHash } from 'crypto';
import { ObjectId } from 'mongodb';
import dbClient from './db';
import redisClient from './redis';

async function getUser(req) {
  const { 'x-token': token } = req.headers;
  const key = `auth_${token}`;
  if (!token) {
    return null;
  }
  const id = await redisClient.get(key);
  if (!id) {
    return null;
  }
  const user = await dbClient.users.findOne({ _id: new ObjectId(id) });
  if (!user) {
    return null;
  }
  return user;
}

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

function encodeBase64(string) {
  return Buffer.from(string, 'utf-8').toString('base64');
}

function decodeBase64(base64) {
  return Buffer.from(base64, 'base64');
}

/**
 * Parses the authorization string and returns an array containing the email and password.
 *
 * @param {string} authString - The authorization string in the format
 * "Basic base64EncodedCredentials".
 * @returns {Array<string>} An array containing the email and password.
 */
function parseAuthorization(authString) {
  const base64 = authString.slice(6);
  const decoded = decodeBase64(base64).toString('utf-8');
  return decoded.split(':');
}

function comparePasswords(password, hash) {
  const newHash = hashPassword(password);
  return newHash === hash;
}

export {
  getUser,
  checkUser,
  hashPassword,
  encodeBase64,
  decodeBase64,
  parseAuthorization,
  comparePasswords,
};
