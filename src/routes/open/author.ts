//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database and validation functions
import { pool, validationFunctions } from '../../core/utilities';

const authorRoutes: Router = express.Router();

/**
 * Validator for the author name in query parameters
 */
function mwValidAuthorName(
    request: Request,
    response: Response,
    next: NextFunction
) {
    console.log('mw');
    console.log('Request here = ' + request);
    console.log('Response = ' + response);
    const authorName = request.params.authorname;
    console.log('Author = ' + authorName);

    if (
        validationFunctions.isStringProvided(authorName) &&
        isNaN(Number(authorName)) &&
        authorName.trim().length > 0
    ) {
        next();
    } else {
        console.error('Invalid author name parameter');
        response.status(400).send({
            message: 'Invalid author name - please refer to documentation',
        });
    }
}

/**
 * @api {get} /author/all Request to retrieve all authors
 *
 * @apiDescription Request to retrieve all the authors from the database.
 *
 * @apiName GetAllAuthors
 * @apiGroup Author
 *
 * @apiSuccess {Object[]} authors List of authors.
 * @apiSuccess {number} authors.authorid The author's ID.
 * @apiSuccess {string} authors.authorname The author's name.
 *
 * @apiError (500: Server Error) {String} message "server error - contact support"
 */
authorRoutes.get('/all', (request: Request, response: Response) => {
    const theQuery = 'SELECT * FROM Authors';

    pool.query(theQuery)
        .then((result) => {
            response.send({
                authors: result.rows,
            });
        })
        .catch((error) => {
            console.error('DB Query error on GET /author/authors');
            console.error(error);
            response.status(500).send({
                message: 'server error - contact support',
            });
        });
});

/**
 * @api {get} /author/ Request to catch missing author name
 *
 * @apiDescription Catches requests where author name is missing and returns a 400 error
 *
 * @apiName MissingAuthorName
 * @apiGroup Author
 *
 * @apiError (400: Missing Author Name) {String} message "Missing author name - please provide a valid author name"
 */
authorRoutes.get('/', (request: Request, response: Response) => {
    console.error('Missing author name');
    response.status(400).send({
        message: 'Missing valid author name - please refer to documentation',
    });
});

/**
 * @api {get} /author/:name Request to retrieve books by the author's full name
 *
 * @apiDescription Request to retrieve all books for a given author's full name. MUST BE AUTHOR'S FULL NAME
 *
 * @apiName GetBooksByAuthor
 * @apiGroup Author
 *
 * @apiParam {string} name The author's full name to search for.
 *
 * @apiSuccess {String} author The name of the author.
 * @apiSuccess {Object[]} books List of books written by the author.
 * @apiSuccess {number} books.bookid The book ID.
 * @apiSuccess {string} books.title The title of the book.
 * @apiSuccess {string} books.original_title The original title (if different).
 * @apiSuccess {number} books.publication_year The year the book was published.
 *
 * @apiError (400: Invalid or Missing Author Name) {String} message "Missing or invalid author name - please refer to documentation"
 * @apiError (404: Not Found) {String} message "No books found for given author"
 * @apiError (500: Server Error) {String} message "server error - contact support"
 */
authorRoutes.get(
    '/:authorname',
    mwValidAuthorName,
    (request: Request, response: Response) => {
        const authorName = request.params.authorname as string;
        console.log('function');
        console.log(authorName);
        const theQuery = `
            SELECT b.bookid, b.title, b.original_title, b.publication_year, a.authorname
            FROM Books b
            JOIN BookAuthor ba ON b.bookid = ba.bookid
            JOIN Authors a ON ba.authorid = a.authorid
            WHERE a.authorname ILIKE $1
        `;

        const values = [authorName];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.send({
                        author: result.rows[0].authorname,
                        books: result.rows.map((row) => ({
                            bookid: row.bookid,
                            title: row.title,
                            original_title: row.original_title,
                            publication_year: row.publication_year,
                        })),
                    });
                } else {
                    response.status(404).send({
                        message: 'No books found for given author',
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on GET /author/:name');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { authorRoutes };
