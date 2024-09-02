import fs from 'node:fs';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import createFile from '../utils/crud';

export default async function postUpload(req, res) {
  const { user } = req;
  const TYPES = ['folder', 'file', 'image'];
  const folerPath = process.env.FOLDER_PATH || '/tmp/files_manager';
  const { name, type, data } = req.body;
  let { parentId, isPublic } = req.body;
  isPublic = isPublic || false;
  parentId = parentId || 0;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  if (!TYPES.includes(type)) {
    return res.status(400).json({ error: 'Missing type' });
  }
  if (!data && type !== 'folder') {
    return res.status(400).json({ error: 'Missing data' });
  }
  fs.mkdirSync(folerPath, { recursive: true });

  if (parentId) {
    const parentFolder = await dbClient.files.findOne({
      _id: new ObjectId(parentId),
    });
    if (!parentFolder) {
      return res.status(400).json({ error: 'Parent not found' });
    }
    if (parentFolder.type !== 'folder') {
      return res.status(400).json({ error: 'Parent is not a folder' });
    }
  }
  const result = {
    userId: user._id.toString(),
    name,
    type,
    parentId,
    isPublic,
  };
  if (type === 'folder') {
    const folder = await dbClient.files.insertOne({ ...result });
    console.log(result);
    res.status(201).json({ id: folder.insertedId.toString(), ...result });
  } else {
    const filePath = createFile(folerPath, data);
    const file = await dbClient.files.insertOne({
      ...result,
      localPath: filePath,
    });
    console.log(result);
    return res.status(201).json({ id: file.insertedId.toString(), ...result });
  }
}
