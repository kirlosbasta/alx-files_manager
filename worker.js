import Bull from 'bull';
import thumbnail from 'image-thumbnail';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from './utils/db';

const fileQueue = new Bull('fileQueue');
const userQueue = new Bull('userQueue');
const width = [100, 250, 500];

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;
  if (!fileId) throw new Error('Missing fileId');
  if (!userId) throw new Error('Missing userId');
  try {
    const file = await dbClient.files.findOne({
      _id: new ObjectId(fileId),
      userId,
    });
    if (!file) throw new Error('File not found');
    width.forEach(async (w) => {
      const data = fs.readFileSync(file.localPath);
      const thumb = await thumbnail(data, { width: w });
      const thumbName = `${file.localPath}_${w}`;
      fs.writeFileSync(thumbName, thumb);
    });
  } catch (error) {
    throw new Error('File not found');
  }
});

userQueue.process(async (job) => {
  const { userId } = job.data;
  if (!userId) throw new Error('Missing userId');
  try {
    const user = await dbClient.users.findOne({ _id: new ObjectId(userId) });
    if (!user) throw new Error('User not found');
    console.log(`Welcome ${user.email}!`);
  } catch (err) {
    throw new Error('User not found');
  }
});
