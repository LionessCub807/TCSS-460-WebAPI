import express, { Router } from 'express';

import { createRouter } from './createbook';

import { updateRatingRouter } from './updaterating';

const bookRoutes: Router = express.Router();

bookRoutes.use('/books/new', createRouter);

bookRoutes.use('/books', updateRatingRouter);

export { bookRoutes };
