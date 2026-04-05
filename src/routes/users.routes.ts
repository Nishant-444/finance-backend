import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware';
import { authorize } from '../middleware/rbac.middleware';
import usersController from '../controllers/users.controller';

const router = Router();

router.get('/', verifyJWT, authorize('admin'), usersController.getUsers);

router.get('/:id', verifyJWT, authorize('admin'), usersController.getUserById);

router.patch(
	'/:id/role',
	verifyJWT,
	authorize('admin'),
	usersController.updateUserRole,
);

router.patch(
	'/:id/status',
	verifyJWT,
	authorize('admin'),
	usersController.updateUserStatus,
);

export default router;
