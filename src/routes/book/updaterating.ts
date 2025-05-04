import express, { NextFunction, Request, Response, Router } from 'express';

import { pool, validationFunctions } from '../../core/utilities';

const updateRatingRouter: Router = express.Router();

function mwValidRatingBody(
    request: Request,
    response: Response,
    next: NextFunction
) {
    //console.log('hello');
    if (
        //validationFunctions.isNumberProvided(request.body.bookid) &&
        validationFunctions.isNumberProvided(request.body.rating_1_star) &&
        validationFunctions.isNumberProvided(request.body.rating_2_star) &&
        validationFunctions.isNumberProvided(request.body.rating_3_star) &&
        validationFunctions.isNumberProvided(request.body.rating_4_star) &&
        validationFunctions.isNumberProvided(request.body.rating_5_star)
    ) {
        next();
    } else {
        console.error('Missing required information');
        response.status(400).send({
            message:
                'Missing required information: information in the request body is missing - please refer to documentation',
        });
    }
}

updateRatingRouter.put(
    '/:bookid/rating',
    mwValidRatingBody,
    (request: Request, response: Response, next: NextFunction) => {
        console.log('bookid:', request.params.bookid);
        const bookid = parseInt(request.params.bookid);
        console.log('PUT /books/:bookid/rating route hit');
        if (validationFunctions.isNumberProvided(bookid)) {
            next();
        } else {
            console.error('Invalid book ID');
            response.status(400).send({
                message: 'Invalid book ID',
            });
        }
    },
    (request: Request, response: Response) => {
        const bookid = parseInt(request.params.bookid);
        const theQuery = `
        UPDATE Ratings
        SET 
            rating_1_star = $1,
            rating_2_star = $2,
            rating_3_star = $3,
            rating_4_star = $4,
            rating_5_star = $5
        WHERE bookid = $6
        RETURNING *;
    `;
        const values = [
            request.body.rating_1_star,
            request.body.rating_2_star,
            request.body.rating_3_star,
            request.body.rating_4_star,
            request.body.rating_5_star,
            bookid,
        ];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 0) {
                    console.error('Book not found');
                    response.status(404).send({
                        message: 'Book not found',
                    });
                } else {
                    response.status(200).send({
                        message: 'Book rating updated successfully',
                        updatingRatings: result.rows[0],
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on PUT /books/:bookid/rating');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

updateRatingRouter.put(
    '/:bookid/add-star',
    (request: Request, response: Response, next: NextFunction) => {
        const bookid = parseInt(request.params.bookid);
        const ratingColumn = request.body.rating_column;

        // Validate bookid and rating_column
        const validColumns = [
            'rating_1_star',
            'rating_2_star',
            'rating_3_star',
            'rating_4_star',
            'rating_5_star',
        ];

        if (!validationFunctions.isNumberProvided(bookid)) {
            console.error('Invalid book ID');
            return response.status(400).send({
                message: 'Invalid book ID',
            });
        }

        if (!validColumns.includes(ratingColumn)) {
            console.error('Invalid rating column');
            return response.status(400).send({
                message: `Invalid rating column: ${ratingColumn}. Must be one of ${validColumns.join(', ')}`,
            });
        }

        next();
    },
    (request: Request, response: Response) => {
        const bookid = parseInt(request.params.bookid);
        const ratingColumn = request.body.rating_column;

        const theQuery = `
            UPDATE Ratings
            SET ${ratingColumn} = ${ratingColumn} + 1
            WHERE bookid = $1
            RETURNING *;
        `;

        const values = [bookid];

        pool.query(theQuery, values)
            .then((result) => {
                if (result.rowCount === 0) {
                    console.error('Book not found');
                    response.status(404).send({
                        message: 'Book not found',
                    });
                } else {
                    response.status(200).send({
                        message: `Successfully added a star to ${ratingColumn}`,
                        updatedRatings: result.rows[0],
                    });
                }
            })
            .catch((error) => {
                console.error('DB Query error on PUT /books/:bookid/add-star');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { updateRatingRouter };
