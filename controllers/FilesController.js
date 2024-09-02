import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import createFile from '../utils/crud';

async function postUpload(req, res) {
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
    return res
      .status(201)
      .json({ id: folder.insertedId.toString(), ...result });
  }

  const filePath = createFile(folerPath, data);
  const file = await dbClient.files.insertOne({
    ...result,
    localPath: filePath,
  });
  return res.status(201).json({ id: file.insertedId.toString(), ...result });
}

async function getShow(req, res) {
  const { user } = req;
  const { id } = req.params;
  const file = await dbClient.files.findOne({
    _id: new ObjectId(id),
    userId: user._id.toString(),
  });
  if (!file) return res.status(404).json({ error: 'Not found' });
  const { _id: fileId, localPath, ...rest } = file;
  return res.status(200).json({ id: fileId, ...rest });
}

async function getIndex(req, res) {
  const { user } = req;
  let { parentId, page } = req.query;
  const limit = 20;
  parentId = parentId || 0;
  page = parseInt(page, 10) || 0;
  const skip = page * limit;
  const files = await dbClient.files.aggregate([
    { $match: { userId: user._id.toString(), parentId } },
    { $skip: skip },
    { $limit: limit },
  ]);
  const results = [];
  for await (const file of files) {
    const { _id: id, localPath, ...rest } = file;
    results.push({ id, ...rest });
  }
  return res.status(200).json(results);
}

export { postUpload, getShow, getIndex };
