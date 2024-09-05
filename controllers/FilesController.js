import fs from 'fs';
import mimeType from 'mime-types';
import Bull from 'bull';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import { createFile, processFile } from '../utils/crud';
import { getUser } from '../utils/auth';

const fileQueue = new Bull('fileQueue');

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

  if (parentId === '0') parentId = 0;
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
    userId: user._id,
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
  if (result.type === 'image') {
    await fileQueue.add({
      userId: user._id.toString(),
      fileId: file.insertedId.toString(),
    });
  }
  return res.status(201).json({ id: file.insertedId.toString(), ...result });
}

async function getShow(req, res) {
  const { user } = req;
  const { id } = req.params;
  try {
    const file = await dbClient.files.findOne({
      _id: new ObjectId(id),
      userId: user._id,
    });
    if (!file) return res.status(404).json({ error: 'Not found' });
    return res.status(200).json(processFile(file));
  } catch (err) {
    return res.status(404).json({ error: 'Not found' });
  }
}

async function getIndex(req, res) {
  let { parentId, page } = req.query;
  const limit = 20;
  page = parseInt(page, 10) || 0;
  const skip = page * limit;
  const query = {};
  if (parentId && parentId !== '0') {
    const parentFolder = await dbClient.files.findOne({
      _id: new ObjectId(parentId),
      type: 'folder',
    });
    if (!parentFolder) return res.status(200).json([]);
  }
  if (parentId === '0') parentId = 0;
  if (parentId) query.parentId = parentId;
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
  const newFile = await dbClient.files.findOne({ _id: new ObjectId(id) });
  return res.status(200).json(processFile(newFile));
}
async function putUnpublish(req, res) {
  const { id } = req.params;
  await dbClient.files.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isPublic: false } },
  );
  const newFile = await dbClient.files.findOne({ _id: new ObjectId(id) });
  return res.status(200).json(processFile(newFile));
}

async function getFile(req, res) {
  const user = await getUser(req);
  const { id } = req.params;
  let { size } = req.query;
  size = parseInt(size, 10);
  try {
    const file = await dbClient.files.findOne({ _id: new ObjectId(id) });
    if (!file) return res.status(404).json({ error: 'Not found' });
    if (file.isPublic === false) {
      if (!user || user._id.toString() !== file.userId) {
        return res.status(404).json({ error: 'Not found' });
      }
    }
    if (file.type === 'folder') {
      return res.status(400).json({ error: "A folder doesn't have content" });
    }
    if (!fs.existsSync(file.localPath)) {
      return res.status(404).json({ error: 'Not found' });
    }
    let path = file.localPath;
    if (size) {
      const thumbPath = `${file.localPath}_${size}`;
      if (!fs.existsSync(thumbPath)) {
        return res.status(404).json({ error: 'Not found' });
      }
      path = thumbPath;
    }
    const mime = mimeType.lookup(file.name);
    const data = fs.readFileSync(path);
    return res.status(200).type(mime).send(data);
  } catch (err) {
    return res.status(404).json({ error: 'Not found' });
  }
}

export {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
  getFile,
};
