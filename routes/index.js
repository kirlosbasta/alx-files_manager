import { Router } from 'express';
import { getStatus, getStats } from '../controllers/AppController';
import { postNew, getMe } from '../controllers/UsersController';
import { getConnect, getDisconnect } from '../controllers/AuthController';
import {
  postUpload,
  getShow,
  getIndex,
  putPublish,
  putUnpublish,
} from '../controllers/FilesController';
import authenticate from '../middleware/authenticate';
import checkFile from '../middleware/files';

const router = Router();

router.get('/status', getStatus);
router.get('/stats', getStats);
router.post('/users', postNew);
router.get('/connect', getConnect);
router.get('/disconnect', authenticate, getDisconnect);
router.get('/users/me', authenticate, getMe);
router.post('/files', authenticate, postUpload);
router.get('/files/:id', authenticate, getShow);
router.get('/files', authenticate, getIndex);
router.put('/files/:id/publish', authenticate, checkFile, putPublish);
router.put('/files/:id/unpublish', authenticate, checkFile, putUnpublish);

export default router;
