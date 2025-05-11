import express, { NextFunction, Request, Response, Router } from 'express';
import { pool, validationFunctions } from '../../core/utilities';

const deleteSeries: Router = express.Router();

/**
 * Validator for the series path parameter
 */
function mwValidSeriesParam(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const { series } = request.params;

    if (
        typeof series === 'string' &&
        validationFunctions.isStringProvided(series.trim())
    ) {
        next();
    } else {
        console.error('Invalid series path parameter');
        response.status(400).send({
            message:
                'Missing or invalid "series" name parameter - please refer to documentation',
        });
    }
}
/**
 * This route is here so that we're able to deal with routes with nothing after it. ex: url/books/delete
 */
deleteSeries.delete('/', (req, res) => {
    res.status(400).send({
        message:
            'Missing "series" name parameter - please refer to documentation',
    });
});

/**
 * @api {delete} /books/delete/:series Delete books by full or partial title match
 *
 * @apiDescription Deletes all books whose titles partially match the given string (not case sensitive).
 *
 * @apiName DeleteBookSeries
 * @apiGroup Books
 *
 * @apiParam {String} series The full or partial title of the book series to delete.
 *
 * @apiSuccess {String} message Description of the number of books deleted.
 * @apiSuccess {Object[]} deleted List of deleted book entries.
 *
 * @apiError (400: Invalid Title) {String} message "Missing or invalid 'series' path parameter - please refer to documentation"
 * @apiError (404: Not Found) {String} message "No books found with the specified title pattern"
 * @apiError (500: Server Error) {String} message "server error - contact support"
 */
deleteSeries.delete(
    '/:series',
    mwValidSeriesParam,
    (request: Request, response: Response) => {
        const series = request.params.series.trim();

        const deleteQuery = `
        DELETE FROM Books
        WHERE title ILIKE $1
        RETURNING *
    `;
        const values = [`%${series}%`];

        pool.query(deleteQuery, values)
            .then((result) => {
                if (result.rowCount > 0) {
                    response.status(200).send({
                        message: `${result.rowCount} book(s) deleted`,
                        deleted: result.rows,
                    });
                } else {
                    response.status(404).send({
                        message:
                            'No books found with the specified title pattern',
                    });
                }
            })
            .catch((error) => {
                console.error('DB error on DELETE /books/:series');
                console.error(error);
                response.status(500).send({
                    message: 'server error - contact support',
                });
            });
    }
);

export { deleteSeries };
