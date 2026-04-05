import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import recordsController from '../controllers/records.controller';

const router = Router();

router.post('/', verifyJWT, authorize('admin'), recordsController.createRecord);

router.get(
	'/',
	verifyJWT,
	authorize('admin', 'analyst', 'viewer'),
	recordsController.getRecords,
);

router.put(
	'/:id',
	verifyJWT,
	authorize('admin'),
	recordsController.updateRecord,
);

router.delete(
	'/:id',
	verifyJWT,
	authorize('admin'),
	recordsController.deleteRecord,
);

export default router;
