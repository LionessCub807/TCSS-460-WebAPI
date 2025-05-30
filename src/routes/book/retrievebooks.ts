import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../core/utilities';

const retrieveAllRouter: Router = express.Router();

const isNumberProvided = validationFunctions.isNumberProvided;

/**
 * @apiDefine JWT
 * @apiHeader {String} Authorization The string "Bearer " + a valid JSON Web Token (JWT).
 */

/**
 * @api {get} /books/all?cursor&limit Request to retrieve entries by Cursor pagination.
 *
 * @apiDescription Request to retrieve paginated the entries using an entry limit and offset.
 *
 * @apiName Books Cursor Pagination
 * @apiGroup Books
 *
 *
 * @apiQuery {number} limit the number of entry objects to return. Note, if a value less than
 * 0 is provided or a non-numeric value is provided or no value is provided, the default limit
 * amount of 10 will be used.
 *
 * @apiQuery {number} cursor the number from the start of the data set of the book to be accessed, 0 is the default value.
 *
 * @apiSuccess {Object} pagination metadata results from this paginated query.
 * @apiSuccess {number} pagination.limit the number of entry objects to returned.
 *
 * @apiSuccess {Object[]} entries the message entry objects of all entries.
 * @apiSuccess {number} entries.isbn13.
 * @apiSuccess {string} entries.authorname the name of the author who wrote the book.
 * @apiSuccess {number} entries.publication_year the year the book was first published.
 * @apiSuccess {string} entries.original_title the original title of the book.
 * @apiSuccess {string} entries.title the title of the book.
 * @apiSuccess {number} entries.average the overall average rating of the book.
 * @apiSuccess {number} entries.count the total number of reviews.
 * @apiSuccess {number} entries.rating_1_star the number of one star reviews.
 * @apiSuccess {number} entries.rating_2_star the number of two star reviews.
 * @apiSuccess {number} entries.rating_3_star the number of three star reviews.
 * @apiSuccess {number} entries.rating_4_star the number of four star reviews.
 * @apiSuccess {number} entries.rating_5_star the number of five star reviews.
 * @apiSuccess {string} entries.image_url the url of the image representing the book.
 * @apiSuccess {string} entries.image_small_url the url of the small image that represents the book.
 *
 */
retrieveAllRouter.get('/', async (request: Request, response: Response) => {

    // NOTE: +request.query.limit the + tells TS to treat this string as a number
    const limit: number =
        isNumberProvided(request.query.limit) && +request.query.limit > 0
            ? +request.query.limit
            : 10;
    const cursor: number =
        isNumberProvided(request.query.cursor) && +request.query.cursor >= 0
            ? +request.query.cursor
            : 0;

    const theQuery = `SELECT Books.isbn13, 
                             Books.publication_year, 
                             Books.original_title, 
                             Books.title,
                             ROUND((Ratings.rating_1_star * 1.0 + Ratings.rating_2_star * 2.0 + 
                             Ratings.rating_3_star * 3.0 + Ratings.rating_4_star * 4.0 + 
                             Ratings.rating_5_star * 5.0) / (Ratings.rating_1_star + 
                             Ratings.rating_2_star + Ratings.rating_3_star + Ratings.rating_4_star + 
                             Ratings.rating_5_star), 2) AS average,
                             Ratings.rating_1_star + Ratings.rating_2_star + Ratings.rating_3_star + 
                             Ratings.rating_4_star + Ratings.rating_5_star AS count,
                             Ratings.rating_1_star,
                             Ratings.rating_2_star, 
                             Ratings.rating_3_star, 
                             Ratings.rating_4_star,
                             Ratings.rating_5_star,
                             Books.image_url,
                             Books.image_small_url
                             FROM Books JOIN Ratings ON Books.bookid = Ratings.bookid
                             AND Books.bookid > $2
                             ORDER BY Books.bookid
                             LIMIT $1`;
    
    const values = [limit, cursor];

    const { rows } = await pool.query(theQuery, values);
    
    const result = await pool.query(
        'SELECT count(bookid) from Books;'
    );
   
    const count = result.rows[0].count;

    response.send({
        entries: rows.map((entry) => ({
            Book:{
            isbn13: entry.isbn13,
            authors: entry.authorname,
            publication: entry.publication_year,
            original_title: entry.original_title,
            title: entry.title,
            ratings: {
               average: entry.average,
               count: entry.count,
               rating_1: entry.rating_1_star,
               rating_2: entry.rating_2_star,
               rating_3: entry.rating_3_star,
               rating_4: entry.rating_4_star,
               rating_5: entry.rating_5_star
           },
            icon: {
               large: entry.image_url,
               small: entry.image_small_url
           }
       }
        })),
        pagination: {
            totalRecords: count
        },
    });
});

export { retrieveAllRouter };
