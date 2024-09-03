import fs from 'fs';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import { createFile, processFile } from '../utils/crud';

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
  return res.status(200).json(processFile(file));
}

async function getIndex(req, res) {
  let { parentId, page } = req.query;
  const limit = 20;
  parentId = parentId || 0;
  page = parseInt(page, 10) || 0;
  const skip = page * limit;
  const query = {};
  if (parentId !== 0) query.parentId = parentId;
  const files = await dbClient.files.aggregate([
    { $match: query },
    { $skip: skip },
    { $limit: limit },
  ]);
  const results = [];
  for await (const file of files) {
    results.push(processFile(file));
  }
  return res.status(200).json(results);
}

async function putPublish(req, res) {
  const { id } = req.params;
  await dbClient.files.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isPublic: true } },
  );
  const file = await dbClient.files.findOne({ _id: new ObjectId(id) });
  return res.status(200).json(processFile(file));
}
async function putUnpublish(req, res) {
  const { id } = req.params;
  await dbClient.files.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isPublic: false } },
  );
  const file = await dbClient.files.findOne({ _id: new ObjectId(id) });
  return res.status(200).json(processFile(file));
}

export {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
};
