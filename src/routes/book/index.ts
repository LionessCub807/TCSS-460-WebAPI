import express, { Router } from 'express';
import { checkToken } from '../../core/middleware';

import { createRouter } from './createbook';

import { updateRatingRouter } from './updaterating';

import { retrieveAllRouter } from './retrievebooks';

import { titleRouter } from './bookbytitle';

import { yearRouter } from './booksbyyear';

const bookRoutes: Router = express.Router();

bookRoutes.use('/books/new', createRouter);

bookRoutes.use('/books', updateRatingRouter);

bookRoutes.use('/books/all', retrieveAllRouter);

bookRoutes.use('/books/title/', titleRouter);

bookRoutes.use('/books/year', yearRouter);


export { bookRoutes };
