import express, { Router } from 'express';

import { createRouter } from './createbook';

import { retrieveAllRouter } from './retrievebooks';

const bookRoutes: Router = express.Router();

bookRoutes.use('/books/new', createRouter);

bookRoutes.use('/books/all', retrieveAllRouter);

export { bookRoutes };