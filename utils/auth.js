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

function encodeBase64(string) {
  return Buffer.from(string, 'utf-8').toString('base64');
}

function decodeBase64(base64) {
  return Buffer.from(base64, 'base64').toString('utf-8');
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
  const decoded = decodeBase64(base64);
  return decoded.split(':');
}

function comparePasswords(password, hash) {
  const newHash = hashPassword(password);
  return newHash === hash;
}

export {
  checkUser,
  hashPassword,
  encodeBase64,
  decodeBase64,
  parseAuthorization,
  comparePasswords,
};
