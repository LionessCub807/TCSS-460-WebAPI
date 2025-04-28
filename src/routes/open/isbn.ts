import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../core/utilities';

const isbnRouter: Router = express.Router();

function mwValidISBN(request: Request, response: Response, next: NextFunction) {
    if (
        validationFunctions.isNumberProvided(request.params.isbn13) &&
        request.params.isbn13.toString().length == 13
    ) {
        next();
    } else {
        console.error('Invalid ISBN format');
        response.status(400).send({
            message: 'Missing valid ISBN - please refer to documentation',
        });
    }
}

/**
 * @api {get} /isbn/:isbn13 Request to get an entry by ISBN
 *
 * @apiDescription Request to retrieve the complete entry for <code>ISBN</code>.
 * Note this endpoint returns an entry as an object, not a formatted string like the
 * other endpoints.
 *
 * @apiName GetBookByISBN
 * @apiGroup ISBN
 *
 * @apiParam {number} isbn the isbn to look up.
 *
 * @apiSuccess {Object} entry the entry object for <code>ISBN</code>
 * @apiSuccess {number} entry.bookid The bookid associated with <code>ISBN</code>
 * @apiSuccess {string} entry.isbn13 <code>ISBN</code>
 * @apiSuccess {number} entry.publication_year The year the book with <code>ISBN</code> was published
 * @apiSuccess {string} entry.orignal_title The original title associated with <code>ISBN</code>
 * @apiSuccess {string} entry.title The title associated with <code>ISBN</code>
 * @apiSuccess {string} entry.image_url The image URL associated with <code>ISBN</code>
 * @apiSuccess {string} entry.image_small_url The small image URL associated with <code>ISBN</code>
 *
 * @apiError (404: ISBN Not Found) {string} message "ISBN not found"
 * @apiError (404: Missing Valid ISBN) {string} message "Missing valid ISBN - please refer to documentation"
 */

isbnRouter.get(
    '/:isbn13',
    mwValidISBN,
    (request: Request, response: Response) => {
        const theQuery = 'SELECT * FROM Books WHERE isbn13 = $1';
        const values = [request.params.isbn13];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 1) {
                    response.send({
                        entry: result.rows[0],
                    });
                } else {
                    response.status(404).send({
                        message: 'ISBN not found',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /:isbn13');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { isbnRouter };
