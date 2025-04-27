import express, { Router } from 'express';

import { messageRouter } from './message';
import { isbnRouter } from './isbn';
import { authorRoutes } from './author';

const openRoutes: Router = express.Router();

openRoutes.use('/message', messageRouter);
openRoutes.use('/isbn', isbnRouter);
openRoutes.use('/author', authorRoutes);

export { openRoutes };
