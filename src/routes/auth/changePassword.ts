import express, { Request, Response, Router, NextFunction } from 'express';

import jwt from 'jsonwebtoken';
import { IJwtRequest } from '../../core/models/JwtRequest.model';

import {
    pool,
    validationFunctions,
    credentialingFunctions,
} from '../../core/utilities';

import { checkToken } from '../../core/middleware/jwt';

const isStringProvided = validationFunctions.isStringProvided;
const generateHash = credentialingFunctions.generateHash;
const generateSalt = credentialingFunctions.generateSalt;

const changePasswordRouter: Router = express.Router();

// extending Request to add the auth property
export interface ChangePasswordRequest extends IJwtRequest {
    auth: {
        oldPassword: string;
        newPassword: string;
    };
}

// Password validation - must match the same rules as in registration
const isValidPassword = (password: string): boolean =>
    isStringProvided(password) && password.length > 7;

/**
 * @api {put} /changePassword Request to change a user's password
 * @apiName ChangePassword
 * @apiGroup Auth
 *
 * @apiDescription Allows an authenticated user to change their password. It will require that you have a JWT and you old password.
 *
 * @apiHeader {String} authorization Valid JSON Web Token
 *
 * @apiBody {String} oldPassword User's current password
 * @apiBody {String} newPassword User's new password (must be > 7 characters)
 *
 * @apiSuccess {Boolean} success Indicates the password was changed successfully
 * @apiSuccess {String} message "Password successfully changed"
 *
 * @apiError (400: Missing Information) {String} message "Missing required information"
 * @apiError (400: Invalid Password) {String} message "Invalid password - must be greater than 7 characters"
 * @apiError (403: Invalid Credentials) {String} message "Current password is incorrect"
 * @apiError (404: User Not Found) {String} message "User not found"
 * @apiError (500: Server Error) {String} message "Server error - contact support"
 *
 */
changePasswordRouter.put(
    '/changePassword',
    checkToken,
    (
        request: ChangePasswordRequest,
        response: Response,
        next: NextFunction
    ) => {
        // Check both passwords are provided
        if (
            isStringProvided(request.body.oldPassword) &&
            isStringProvided(request.body.newPassword)
        ) {
            next();
        } else {
            response.status(400).send({
                message:
                    'Missing required information - Missing old/new password',
            });
        }
    },
    (
        request: ChangePasswordRequest,
        response: Response,
        next: NextFunction
    ) => {
        // Make sure that new password meets requiements
        if (isValidPassword(request.body.newPassword)) {
            next();
        } else {
            response.status(400).send({
                message: 'Invalid password - must be greater than 7 characters',
            });
        }
    },
    async (request: ChangePasswordRequest, response: Response) => {
        // Extract user ID from JWT claims
        const userId = request.claims.id;

        // Query from Account Credentials
        const credentialQuery = `SELECT salted_hash, salt 
                               FROM Account_Credential 
                               WHERE account_id = $1`;

        try {
            const credentialResult = await pool.query(credentialQuery, [
                userId,
            ]);

            if (credentialResult.rowCount === 0) {
                response.status(404).send({
                    message: 'User not found',
                });
                return;
            }

            // Get current salt and hash
            const salt = credentialResult.rows[0].salt;
            const storedSaltedHash = credentialResult.rows[0].salted_hash;

            // Generate hash from provided old password
            const oldPasswordHash = generateHash(
                request.body.oldPassword,
                salt
            );

            // Verify old password is correct
            if (storedSaltedHash === oldPasswordHash) {
                // Old password verified, generate new salt and hash
                const newSalt = generateSalt(32);
                const newSaltedHash = generateHash(
                    request.body.newPassword,
                    newSalt
                );

                // Update password
                const updateQuery = `UPDATE Account_Credential 
                                   SET salted_hash = $1, salt = $2 
                                   WHERE account_id = $3`;

                await pool.query(updateQuery, [newSaltedHash, newSalt, userId]);

                response.status(200).send({
                    success: true,
                    message: 'Password successfully changed',
                });
            } else {
                response.status(403).send({
                    message: 'Current password is incorrect',
                });
            }
        } catch (error) {
            console.error('DB Query error on password change');
            console.error(error);
            response.status(500).send({
                message: 'Server error - contact support',
            });
        }
    }
);

export { changePasswordRouter };
