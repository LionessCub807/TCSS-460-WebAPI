//express is the framework we're going to use to handle requests
import express, { NextFunction, Request, Response, Router } from 'express';
//Access the connection to Postgres Database and validation functions
import { pool, validationFunctions } from '../../core/utilities';

const titleRouter: Router = express.Router();

/**
 * Validator for the author name in query parameters
 */
function mwValidTitle(
    request: Request,
    response: Response,
    next: NextFunction
) {
    const title = request.params.title;

    if (
        validationFunctions.isStringProvided(title)
    ) {
        next();
    } else {
        console.error('Invalid book title');
        response.status(400).send({
            message: 'Invalid book title - please refer to documentation',
        });
    }
}

/**
 * @api {get} /books/title/:title Request to retrieve books by their title
 *
 * @apiDescription Request to retrieve a book by its title, 
 * title must be spelled correctly with proper punctuation, spaces and capital letters do not affect the search.
 *
 * @apiName GetBooksByTitle
 * @apiGroup Books
 *
 * @apiParam {string} the title of the book.
 *
 * @apiSuccess {Book} an Book object containing all the information on the book.
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
 * @apiError (400: Invalid Information) {String} message "Invalid book title - please refer to documentation"
 * @apiError (404: Not Found) {String} message "Book not found"
 * @apiError (500: Server Error) {String} message "server error - contact support"
 */
titleRouter.get(
    '/:title',
    mwValidTitle, async (request: Request, response: Response) => {
        //removes all white space to make title matching easier
        const title = request.params.title.toLowerCase().replace(/\s/g, "") as string;
        
        const theQuery = `SELECT DISTINCT Books.isbn13, 
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
                             AND REPLACE(LOWER(Books.original_title), ' ', '') = $1`;
                  
        const query =  `SELECT Authors.authorname FROM BookAuthor JOIN Authors ON Authors.authorid = BookAuthor.authorid JOIN Books ON Books.bookid = BookAuthor.bookid AND REPLACE(LOWER(Books.original_title), ' ', '') = $1 `          
        const values = [title];

        try {
            const result = await pool.query(theQuery, values);
            const author = await pool.query(query, values);
            
            if (result.rowCount == 1) {

                response.status(200).send({
                    
                    Book:{
                        isbn13: result.rows[0].isbn13,
                        authors: author.rows.reduce((accumulator, current, index) => {
                                    const authorName = current.authorname;
  
                                    if (index === 0) {
                                        return authorName;
                                    }
  
                                    return `${accumulator} ${authorName}`;
                                    }, ''),
                        publication: result.rows[0].publication_year,
                        original_title: result.rows[0].original_title,
                        title: result.rows[0].title,
                        ratings: {
                            average: parseFloat(result.rows[0].average),
                            count: result.rows[0].count,
                            rating_1: result.rows[0].rating_1_star,
                            rating_2: result.rows[0].rating_2_star,
                            rating_3: result.rows[0].rating_3_star,
                            rating_4: result.rows[0].rating_4_star,
                            rating_5: result.rows[0].rating_5_star
                        },
                        icon: {
                            large: result.rows[0].image_url,
                            small: result.rows[0].image_small_url
                        }
                    } 
                }); 

            } else {
                response.status(404).send({
                    message: 'Book not found',
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

export { titleRouter };