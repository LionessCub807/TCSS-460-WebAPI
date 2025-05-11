import express, { Router } from 'express';

import { createRouter } from './createbook';

import { updateRatingRouter } from './updaterating';

import { retrieveAllRouter } from './retrievebooks';

import { deleteBookByISBNRouter } from './deleteBookByISBN';

import { deleteSeries } from './deleteSeriesOfBooks';

const bookRoutes: Router = express.Router();

bookRoutes.use('/books/new', createRouter);

bookRoutes.use('/books', updateRatingRouter);

bookRoutes.use('/books/all', retrieveAllRouter);

bookRoutes.use('/books', deleteBookByISBNRouter);

bookRoutes.use('/books/delete', deleteSeries);

export { bookRoutes };
