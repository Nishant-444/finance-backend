import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { verifyJWT } from '../middleware/auth.middleware';

const router = Router();

router.route('/register').post(authController.register);
router.route('/login').post(authController.login);
router.route('/refresh-token').post(authController.refreshAccessToken);
router.route('/logout').post(verifyJWT, authController.logout);

export default router;
