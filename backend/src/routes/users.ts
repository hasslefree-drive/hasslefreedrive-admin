import { Router } from 'express';
import { getUsers, getUser, updateUserRole } from '../controllers/userController';

const router = Router();

router.get('/', getUsers);
router.get('/:uid', getUser);
router.patch('/:uid/role', updateUserRole);

export default router;
