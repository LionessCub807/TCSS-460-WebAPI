import express, { Router } from 'express';

import { createRouter } from './createbook';

const bookRoutes: Router = express.Router();

bookRoutes.use('/books/new', createRouter);

export { bookRoutes };