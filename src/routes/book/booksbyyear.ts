//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database and validation functions
import { pool, validationFunctions } from '../../core/utilities';

const yearRouter: Router = express.Router();

//returns all names that match a given isbn number
const getAuthorNames = (authors, isbn) => {
    let names = []
    authors.forEach((entry) => {
        if(entry.isbn13 == isbn) {
            names.push(entry.authorname);
        }
    })
    return names;
}

// returns the formatted book
const mapAuthorsToBooks = (Books, Authors) => {
    let returnBooks = Array.from(Books);

    for(let i = 0; i < Books.length; i ++) {
        returnBooks[i] = {
            Book:{
                isbn13: Books[i].isbn13,
                authors: getAuthorNames(Authors, Books[i].isbn13),
                publication: Books[i].publication_year,
                original_title: Books[i].original_title,
                title: Books[i].title,
                ratings: {
                    average: parseFloat(Books[i].average),
                    count: Books[i].count,
                    rating_1: Books[i].rating_1_star,
                    rating_2: Books[i].rating_2_star,
                    rating_3: Books[i].rating_3_star,
                    rating_4: Books[i].rating_4_star,
                    rating_5: Books[i].rating_5_star
                },
                icon: {
                    large: Books[i].image_url,
                    small: Books[i].image_small_url
                }
            }
        }
    }

    return returnBooks;
}

/**
 * Validator for the author name in query parameters
 */
function mwValidYear(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const year = request.params.year;
    if (
        validationFunctions.isNumberProvided(year) &&
        parseInt(year as string) > 0 &&
        (year as string).length < 5
    ) {
        next();
    } else {
        console.error('Invalid year parameter');
        response.status(400).send({
            message: 'Invalid year parameter provided - please refer to documentation',
        });
    }
}

/**
 * @api {get} /books/year Request to retrieve books by the year they were published
 *
 * @apiDescription Request to retrieve all books for a given publishing year
 *
 * @apiName GetBooksByYear
 * @apiGroup Books
 * 
 * @apiParam {number} year the year published of the books to be returned.
 * 
 * @apiQuery {number} limit the number of books returned that match the year published. 
 * If no parameter is provided then a default of 10 results will be returned. If the number
 * of results is less than the limit, all results will be returned.
 * 
 * @apiQuery {number} offset the offset from the start of the result set. Default is zero if no value is provided.
 *
 * @apiSuccess {Object[]} entries List of books that were published in the given year.
 * @apiSuccess {Object} pagination an object containing information on the pagination request.
 * @apiSuccessExample {json} Success-Response:
 * {
 *      entries: [
 *          "Book": {
 *               "isbn13": "9790203957193",
 *               "authors": [
 *                   "author1",
 *                   "author2"
 *               ],
 *               "publication": 2017,
 *               "original_title": "Title",
 *               "title": "Title",
 *               "ratings": {
 *                   "average": 3.57,
 *                   "count": 3916824,
 *                   "rating_1": 456191,
 *                   "rating_2": 436802,
 *                   "rating_3": 793319,
 *                   "rating_4": 875073,
 *                   "rating_5": 1355439
 *               },
 *               "icon": {
 *                   "large": "url",
 *                   "small": "url"
 *               }
 *           }
 *      ]
 *      pagination: {
 *          "totalRecords": 10,
 *          "limit": 10,
 *          "offset": 0,
 *          "nextPage": 10
 *      }
 * }
 *
 * @apiError (400: Invalid Information) {String} message "Invalid year parameter provided - please refer to documentation"
 * @apiError (404: Not Found) {String} message "There are no books listed as published in (year)"
 * @apiError (500: Server Error) {String} message "server error - contact support"
 */
yearRouter.get(
    '/:year',
    mwValidYear, async (request: Request, response: Response) => {
        const year = request.params.year as string;
        const limit: number = validationFunctions.isNumberProvided(request.query.limit) && +request.query.limit > 0
            ? +request.query.limit
            : 10;
        const offset: number = validationFunctions.isNumberProvided(request.query.offset) && +request.query.offset >= 0
            ? +request.query.offset
            : 0;
        // get all books published in the given year
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
                             AND Books.publication_year = $1
                             ORDER BY Books.original_title
                             LIMIT $2 OFFSET $3`; 
        
     
        const values = [year, limit, offset];
        // separate query to find all authors of a book
        const query =  `SELECT Authors.authorname, Books.isbn13 
                        FROM BookAuthor JOIN Authors ON Authors.authorid = BookAuthor.authorid 
                        JOIN Books ON Books.bookid = BookAuthor.bookid AND Books.publication_year = $1 
                        ORDER BY Books.original_title LIMIT $2 OFFSET $3`          

        try { 
            const result = await pool.query(theQuery, values);
            const author = await pool.query(query, values);

            const count = await pool.query(`SELECT COUNT(Books.bookid) FROM BOOKS WHERE Books.publication_year = $1`, [year]);

            if (result.rowCount >= 1) {

                response.status(200).send({
                    entries: mapAuthorsToBooks(result.rows, author.rows),
                    pagination: {
                        totalRecords: parseInt(count.rows[0].count),
                        limit,
                        offset,
                        nextPage: limit + offset,
                    },
                });

            } else {
                response.status(404).send({
                    message: `There are no books listed as published in ${year}`,
                });
            }
                
        } 
        catch (error) {
            console.error(error);

            response.status(500).send({
                message: "server error - contact support"
            });
        }
    }
);

export { yearRouter };