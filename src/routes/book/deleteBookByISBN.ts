import express, { Request, Response } from 'express';
import { pool } from '../../core/utilities';

const deleteBookByISBNRouter = express.Router();

/**
 * @api {delete} /book/isbn/:isbn13 Delete a book by ISBN
 *
 * @apiDescription Deletes a book entry from the database using its ISBN.
 *
 * @apiName DeleteBookByISBN
 * @apiGroup Book
 *
 * @apiParam {string} isbn13 The ISBN of the book to delete.
 *
 * @apiSuccess {string} message "Book deleted successfully"
 *
 * @apiError (404: ISBN Not Found) {string} message "ISBN not found"
 * @apiError (400: Invalid ISBN) {string} message "Invalid ISBN format"
 * @apiError (500: Server Error) {string} message "Server error - contact support"
 */
deleteBookByISBNRouter.delete(
    '/isbn/:isbn13',
    (request: Request, response: Response) => {
        const isbn13 = request.params.isbn13;

        // Validate ISBN format
        if (!isbn13 || isbn13.length !== 13 || isNaN(Number(isbn13))) {
            return response.status(400).send({
                message: 'Invalid ISBN format',
            });
        }

        const query = 'DELETE FROM Books WHERE isbn13 = $1';
        const values = [isbn13];
        console.log('Executing query:', query, 'with values:', values);
        pool.query(query, values)
            .then((result) => {
                if (result.rowCount == 1) {
                    response.send({
                        message: 'Book deleted successfully',
                    });
                } else {
                    response.status(404).send({
                        message: 'ISBN not found',
                    });
                }
            })
            .catch((error) => {
                console.error('Error executing DELETE query:', error);
                response.status(500).send({
                    message: 'Server error - contact support',
                });
            });
    }
);

export { deleteBookByISBNRouter };
