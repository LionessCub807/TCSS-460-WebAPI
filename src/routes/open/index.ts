import express, { Router } from 'express';

import { messageRouter } from './message';
import { isbnRouter } from './isbn';

const openRoutes: Router = express.Router();

openRoutes.use('/message', messageRouter);
openRoutes.use('/isbn', isbnRouter);

export { openRoutes };
