import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

const createRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;

const format = (resultRow) =>
    `{${resultRow.priority}} - [${resultRow.name}] says: ${resultRow.message}`;

const formatKeep = (resultRow) => ({
    ...resultRow,
    formatted: `{${resultRow.priority}} - [${resultRow.name}] says: ${resultRow.message}`,
});

function mwValidBookBody(
    request: Request,
    response: Response,
    next: NextFunction
) {
    if (
        isStringProvided(request.body.author) &&
        isStringProvided(request.body.title) &&
        isStringProvided(request.body.originalTitle) &&
        isStringProvided(request.body.imageurl) &&
        isStringProvided(request.body.iconurl)

    ) {
        next();
    } else {
        console.error('Missing required information relating to the author, title, or originalTitle field');
        response.status(400).send({
            message:
                'Missing required information relating to the author, title, or originalTitle field',
        });
    }
}

/**
 * @apiDefine JSONError
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 */

/**
 * @api {post} /books/new create a new book entry
 *
 * @apiDescription Request to add a new book to the database with accompanying information
 *
 * @apiName PostMessage
 * @apiGroup Books
 *
 * @apiBody {string} author, the writer of the book
 * @apiBody {string} the title of the book
 * @apiBody {string} the original book title
 * @apiBody {number} the year the book was first published, must be positive and no more than 4 digits
 * @apiBody {number} the ISBN belonging to the book, must be 13 digits
 * @apiBody {number} the amount of 1 star ratings the book has
 * @apiBody {number} the amount of 2 star ratings the book has
 * @apiBody {number} the amount of 3 star ratings the book has
 * @apiBody {number} the amount of 4 star ratings the book has
 * @apiBody {number} the amount of 5 star ratings the book has
 * @apiBody {string} url for image of book
 * @apiBody {string} url for icon of book
 * @apiSuccess (Success 201) {String} entry the string:
 *      "{<code>priority</code>} - [<code>name</code>] says: <code>message</code>"
 *
 * @apiError (400: Name exists) {String} message "Name exists"
 * @apiError (400: Missing Parameters) {String} message "Missing required information - please refer to documentation"
 * @apiError (400: Invalid Priority) {String} message "Invalid or missing Priority  - please refer to documentation"
 * @apiUse JSONError
 */
createRouter.post(
    '/',
    mwValidBookBody,
    (request: Request, response: Response, next: NextFunction) => {
        const one: string = request.body.oneStarRatings as string;
        const two: string = request.body.twoStarRatings as string;
        const three: string = request.body.threeStarRatings as string;
        const four: string = request.body.fourStarRatings as string;
        const five: string = request.body.fiveStarRatings as string;

        if (
            validationFunctions.isNumberProvided(one) &&
            validationFunctions.isNumberProvided(two) &&
            validationFunctions.isNumberProvided(three) &&
            validationFunctions.isNumberProvided(four) &&
            validationFunctions.isNumberProvided(five) 
        ) {
            next();
        } else {
            console.error('Invalid or missing rating value');
            response.status(400).send({
                message:
                    'a rating input is either not provided or not a number - check documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
        const yearpublished: string = request.body.yearPublished.toString();
        const isbn: string = request.body.ISBN.toString();
        if(
            validationFunctions.isNumberProvided(yearpublished) &&
            yearpublished.length <= 4 &&
            parseInt(yearpublished) > 0 &&
            validationFunctions.isNumberProvided(isbn) &&
            isbn.length == 13 
        ) {
            next();
        } else {
            console.error('Invalid or missing year or isbn');
            response.status(400).send({
                message:
                    'the published year or ISBN value provided is either missing, not a number, or not of the required length - check documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
         const theQuery =
            'INSERT INTO books (bookid, isbn13, publication_year, original_title, title, image_url, image_small_url) VALUES (DEFAULT, $1, $2, $3, $4, $5, $6)';
        const values = [
            request.body.ISBN,
            request.body.yearPublished,
            request.body.originalTitle,
            request.body.title,
            request.body.imageurl,
            request.body.iconurl,
        ];
        pool.query(theQuery, values)
             .then((result) => {
               next();
            })
            .catch((error) => {
                if (
                    error.detail != undefined &&
                    (error.detail as string).endsWith('already exists.')
                ) {
                    console.error('Book exists');
                    response.status(400).send({
                        message: 'Book already exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on POST');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error on book - contact support',
                    });
                }
            });
            
    },
    (request: Request, response: Response, next: NextFunction) => {
        const theQuery =
            'INSERT INTO Ratings (rating_1_star, rating_2_star, rating_3_star, rating_4_star, rating_5_star) VALUES ($1, $2, $3, $4, $5)';
        const values = [
            request.body.oneStarRatings,
            request.body.twoStarRatings,
            request.body.threeStarRatings,
            request.body.fourStarRatings,
            request.body.fiveStarRatings,
        ];
        pool.query(theQuery, values)
             .then((result) => {
                next();
            })
            .catch((error) => {
                if (
                    error.detail != undefined &&
                    (error.detail as string).endsWith('already exists.')
                ) {
                    console.error('ratings entry exists');
                    response.status(400).send({
                        message: 'ratings under this ID already exist',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on POST');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error on ratings - contact support',
                    });
                }
            });
            
    },
    (request: Request, response: Response) => {
        //We're using placeholders ($1, $2, $3) in the SQL query string to avoid SQL Injection
        //If you want to read more: https://stackoverflow.com/a/8265319
         const theQuery =
            'INSERT INTO Authors (authorname) VALUES ($1)';
        const values = [
            request.body.author
        ];
        pool.query(theQuery, values)
             .then((result) => {
                response.status(201).send("table created");
            })
            .catch((error) => {
                if (
                    error.detail != undefined &&
                    (error.detail as string).endsWith('already exists.')
                ) {
                    console.error('author exists');
                    response.status(400).send({
                        message: 'an author under this id already exists',
                    });
                } else {
                    //log the error
                    console.error('DB Query error on POST');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error on authors - contact support',
                    });
                }
            });
            
    }
    
);

export { createRouter };