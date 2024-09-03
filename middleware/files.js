import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

export default async function checkFile(req, res, next) {
  const { user } = req;
  const { id } = req.params;
  try {
    const file = await dbClient.files.findOne({
      _id: new ObjectId(id),
      userId: user._id.toString(),
    });
    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }
    req.file = file;
    next();
  } catch (err) {
    return res.status(404).json({ error: 'Not found' });
  }
}
