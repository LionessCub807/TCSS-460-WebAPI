import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../core/utilities';

const retrieveRating: Router = express.Router();

function mwValidRating(
    request: Request,
    response: Response,
    next: NextFunction
) {
    if (validationFunctions.isNumberProvided(request.params.rating)) {
        next();
    } else {
        console.error('Non-numerical value given for rating');
        response.status(400).send({
            message: 'Rating type is not valid - please refer to documentation',
        });
    }
}

/**
 * @api {get} /books/retrieveRating/:rating Request to retrieve books by their rating
 *
 * @apiDescription Request to retrieve a book by its rating. Will return all books with that rating or
 * higher. Will be sorted from lowest to highest.
 *
 * @apiName GetBooksByRating
 * @apiGroup Books
 *
 * @apiParam {number} rating the rating of a book.
 *
 * @apiSuccess {Book} book an Book object containing all the information on the book.
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *     {
 *      "Book": {
 *      "isbn13": "13 digit isbn",
 *      "authors": "Jane Doe John Doe",
 *      "publication": 2016,
 *      "original_title": "Title",
 *      "title": "title",
 *      "ratings": {
 *          "average": 3.0,
 *          "count": 15,
 *          "rating_1": 1,
 *          "rating_2": 2,
 *          "rating_3": 3,
 *          "rating_4": 4,
 *          "rating_5": 5
 *       },
 *      "icon": {
 *          "large": "www.url.com",
 *          "small": "www.url.com"
 *       }
 *      }
 *     }
 * @apiError (400: Invalid Information) {String} message "Rating value is too high or low - please refer to documentation"
 * @apiError (400: Invalid Information) {String} message "Rating type is not valid - please refer to documentation"
 * @apiError (404: Not Found) {String} message "Rating not found"
 * @apiError (500: Server Error) {String} message "server error - contact support"
 */

retrieveRating.get(
    '/:rating',
    mwValidRating,
    (request: Request, response: Response, next: NextFunction) => {
        const rating: number = Number(request.params.rating);
        if (rating >= 0 && rating <= 5) {
            next();
        } else {
            console.error('Given rating is out of range');
            response.status(400).send({
                message:
                    'Rating value is too high or low - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response) => {
        // format this query to work for the book object return
        const theQuery = `SELECT rated_books.*, authors_by_book.authors 
            FROM 
            (SELECT b.bookid, b.title, b.isbn13, b.publication_year, b.original_title, b.image_url, b.image_small_url,
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
            WHERE rated_books.rating >= $1
            ORDER BY rated_books.rating ASC;
        `;

        const values = [request.params.rating];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        Books: result.rows.map((row) => ({
                            isbn13: row.isbn13,
                            authors: row.authors,
                            publication: row.publication_year,
                            original_title: row.original_title,
                            title: row.title,
                            ratings: {
                                average: row.rating,
                                count: row.count,
                                rating_1: row.rating_1_star,
                                rating_2: row.rating_2_star,
                                rating_3: row.rating_3_star,
                                rating_4: row.rating_4_star,
                                rating_5: row.rating_5_star,
                            },
                            icon: {
                                large: row.image_url,
                                small: row.image_small_url,
                            },
                        })),
                    });
                } else {
                    response.status(404).send({
                        message: 'Rating not found',
                    });
                }
            })
            .catch((error) => {
                //log the error
                console.error('DB Query error on GET /:rating');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { retrieveRating };
