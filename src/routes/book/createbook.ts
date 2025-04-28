import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database
import { pool, validationFunctions } from '../../core/utilities';

const createRouter: Router = express.Router();

const isStringProvided = validationFunctions.isStringProvided;

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
                'Missing required information: information relating to the author, title, or originalTitle field is missing',
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
 * @apiName Create Book
 * @apiGroup Books
 *
 * @apiBody {string} author, the writer of the book
 * @apiBody {string} title, the title of the book
 * @apiBody {string} originalTitle, the original book title
 * @apiBody {number} yearPublished, the year the book was first published, must be positive and no more than 4 digits
 * @apiBody {number} ISBN, the ISBN belonging to the book, must be 13 digits
 * @apiBody {number} oneStarRatings, the amount of 1 star ratings the book has
 * @apiBody {number} twoStarRatings, the amount of 2 star ratings the book has
 * @apiBody {number} threeStarRatings, the amount of 3 star ratings the book has
 * @apiBody {number} fourStarRatings, the amount of 4 star ratings the book has
 * @apiBody {number} fiveStarRatings, the amount of 5 star ratings the book has
 * @apiBody {string} imageurl, url for image of book
 * @apiBody {string} iconurl, url for icon of book
 * 
 * @apiSuccess (Success 201) {String} message: book created
 *
 * @apiError (400: Missing required information) {String} message "Missing required information: information relating to the author, title, or originalTitle field is missing - please refer to documentation"
 * @apiError (400: Invalid or missing information) {String} message "Invalid or missing information: rating input is either not provided or not a number - please refer to documentation"
 * @apiError (400: Invalid or missing information) {String} message "Invalid or missing information: the year published or ISBN value provided is either missing, not a number, or not of the required length - please refer to documentation"
 * @apiError (400: Book exists) {String} message "Book already exists"
 * @apiError (500: Server Error) {String} message "server error - contact support"
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
                    'Invalid or missing information: rating input is either not provided or not a number - please refer to documentation',
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
                    'Invalid or missing information: the year published or ISBN value provided is either missing, not a number, or not of the required length - please refer to documentation',
            });
        }
    },
    (request: Request, response: Response, next: NextFunction) => {
         const theQuery =
            'INSERT INTO books (isbn13, publication_year, original_title, title, image_url, image_small_url) VALUES ($1, $2, $3, $4, $5, $6)';
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
                    console.error('DB Query error on POST');
                    console.error(error);
                    response.status(500).send({
                        message: 'server error - contact support'
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
                console.error('DB Query error on POST');
                console.error(error);
                response.status(500).send({
                message: 'server error - contact support'
                });
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
                response.status(201).send("book created");
            })
            .catch((error) => {
                console.error('DB Query error on POST');
                console.error(error);
                response.status(500).send({
                message: 'server error - contact support'
                });
            });       
    }  
);

export { createRouter };