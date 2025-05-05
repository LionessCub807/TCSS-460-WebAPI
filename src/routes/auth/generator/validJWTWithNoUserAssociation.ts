import express, { Request, Response, Router } from 'express';
import jwt from 'jsonwebtoken';

const generateTokenRouter: Router = express.Router();

const key = {
    secret: process.env.JSON_WEB_TOKEN,
};

/**
 * @api {get} /generate-token Generate a JWT token for testing
 * @apiName GenerateNonUsableToken
 * @apiGroup Auth
 *
 * @apiSuccess {String} accessToken JSON Web Token for testing
 * @apiSuccess {Object} user a user object
 * @apiSuccess {string} user.name the test user's name
 * @apiSuccess {string} user.email The test user's email
 * @apiSuccess {string} user.role The test user's role
 * @apiSuccess {number} user.id The test user's id
 */
generateTokenRouter.get(
    '/generate-token',
    (request: Request, response: Response) => {
        // Create a test user for the token
        const testUser = {
            id: 999,
            name: 'Test User',
            email: 'test@example.com',
            role: 'Admin',
        };

        // Generating a token
        const accessToken = jwt.sign(
            {
                name: testUser.name,
                role: testUser.role,
                id: testUser.id,
            },
            key.secret,
            {
                expiresIn: '14 days',
            }
        );

        // Return the token to be used for testing
        response.json({
            accessToken,
            user: testUser,
        });
    }
);

export { generateTokenRouter };
