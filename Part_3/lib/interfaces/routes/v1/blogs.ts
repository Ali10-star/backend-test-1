import { Router } from 'express';
import BlogController from '../../controllers/BlogController';

import AuthenticationMiddleware from '../../middlewares/AuthenticationMiddleware';

const router = Router();

router.get('/', BlogController.findBlogs);
router.get('/:id', BlogController.getBlog);
router.post('/', AuthenticationMiddleware(), BlogController.createBlog);
router.patch('/:id', AuthenticationMiddleware(), BlogController.updateBlog);
router.delete('/:id', AuthenticationMiddleware(), BlogController.deleteBlog);

export default router;