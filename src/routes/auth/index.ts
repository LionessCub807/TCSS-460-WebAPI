import express, { Router } from 'express';

import { signinRouter } from './login';
import { registerRouter } from './register';
import { changePasswordRouter } from './changePassword';
import { generateTokenRouter } from './generator/validJWTWithNoUserAssociation';

const authRoutes: Router = express.Router();

authRoutes.use(signinRouter, registerRouter, changePasswordRouter);

authRoutes.use('/super/secrete/test/do/not/use', generateTokenRouter);

export { authRoutes };
