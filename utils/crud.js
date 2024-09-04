import fs from 'fs';
import path from 'path';
import { v4 } from 'uuid';
import { decodeBase64 } from './auth';

export function createFile(dirname, data) {
  const filePath = path.join(dirname, v4());
  const clearData = decodeBase64(data);
  fs.writeFileSync(filePath, clearData);
  return filePath;
}

export function processFile(file) {
  const { _id: fileId, localPath, ...rest } = file;
  return { id: fileId, ...rest };
}
