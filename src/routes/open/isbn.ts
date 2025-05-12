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
 * @apiSuccess {Object} Book the book object for <code>ISBN</code>
 * @apiSuccess {number} Book.isbn13 <code>ISBN</code>
 * @apiSuccess {string} Book.authors The author associated with <code>ISBN</code>
 * @apiSuccess {number} Book.publication The year the book with <code>ISBN</code> was published
 * @apiSuccess {string} Book.orignal_title The original title associated with <code>ISBN</code>
 * @apiSuccess {string} Book.title The title associated with <code>ISBN</code>
 * @apiSuccess {Object} Book.ratings The ratings associated with <code>ISBN</code>
 * @apiSuccess {number} Book.ratings.average The rating score associated with <code>ISBN</code>
 * @apiSuccess {number} Book.ratings.count The total number of ratings given
 * @apiSuccess {number} Book.ratings.rating_1 The total number of 1 star ratings
 * @apiSuccess {number} Book.ratings.rating_2 The total number of 2 star ratings
 * @apiSuccess {number} Book.ratings.rating_3 The total number of 3 star ratings
 * @apiSuccess {number} Book.ratings.rating_4 The total number of 4 star ratings
 * @apiSuccess {number} Book.ratings.rating_5 The total number of 5 star ratings
 * @apiSuccess {string} Book.icon The icons associated with <code>ISBN</code>
 * @apiSuccess {string} Book.icon.large The large icon associated with <code>ISBN</code>
 * @apiSuccess {string} Book.icon.small The small icon associated with <code>ISBN</code>
 *
 * @apiError (400: ISBN Not Found) {string} message "ISBN not found"
 * @apiError (400: Missing Valid ISBN) {string} message "Missing valid ISBN - please refer to documentation"
 */

isbnRouter.get(
    '/:isbn13',
    mwValidISBN,
    (request: Request, response: Response) => {
        const theQuery = `SELECT rated_books.*, authors_by_book.authors 
            FROM (SELECT b.bookid, b.title, b.isbn13, b.publication_year, b.original_title, b.image_url, b.image_small_url,
            ROUND((r.rating_1_star * 1.0 + r.rating_2_star * 2.0 + r.rating_3_star * 3.0 + r.rating_4_star * 4.0 + r.rating_5_star * 5.0) / 
            (r.rating_1_star + r.rating_2_star + r.rating_3_star + r.rating_4_star + r.rating_5_star), 2) AS rating,
            r.rating_1_star + r.rating_2_star + r.rating_3_star + r.rating_4_star + r.rating_5_star AS count,
            r.rating_1_star, r.rating_2_star, r.rating_3_star, r.rating_4_star, r.rating_5_star
            FROM Books AS b 
            INNER JOIN Ratings AS r ON r.bookid = b.bookid
            ) AS rated_books
            JOIN 
            (SELECT b.bookid, STRING_AGG(DISTINCT a.authorname, ', ' ORDER BY a.authorname) AS authors
            FROM Books b
            JOIN BookAuthor ba ON b.bookid = ba.bookid
            JOIN Authors a ON ba.authorid = a.authorid
            GROUP BY b.bookid
            ) AS authors_by_book
            ON rated_books.bookid = authors_by_book.bookid
            WHERE rated_books.isbn13 = $1`;
        const values = [request.params.isbn13];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount == 1) {
                    response.send({
                        Book: {
                            isbn13: result.rows[0].isbn13,
                            authors: result.rows[0].authors,
                            publication: result.rows[0].publication_year,
                            original_title: result.rows[0].original_title,
                            title: result.rows[0].title,
                            ratings: {
                                average: result.rows[0].rating,
                                count: result.rows[0].count,
                                rating_1: result.rows[0].rating_1_star,
                                rating_2: result.rows[0].rating_2_star,
                                rating_3: result.rows[0].rating_3_star,
                                rating_4: result.rows[0].rating_4_star,
                                rating_5: result.rows[0].rating_5_star,
                            },
                            icon: {
                                large: result.rows[0].image_url,
                                small: result.rows[0].image_small_url,
                            },
                        },
                    });
                } else {
                    response.status(400).send({
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
