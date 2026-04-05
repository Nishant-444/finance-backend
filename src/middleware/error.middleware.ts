import type { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/ApiError';

const errorHandler = (
	err: any,
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	const statusCode = err instanceof ApiError ? err.statusCode : 500;
	const message = err.message || 'Internal server error';
	res.status(statusCode).json({ success: false, message });
};

export default errorHandler;
