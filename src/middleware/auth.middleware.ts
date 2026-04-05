import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../lib/prisma.js';

interface JWTPayload {
	id: string;
	email: string;
	role: string;
}

export const verifyJWT = asyncHandler(async (req, res, next) => {
	const token =
		req.cookies?.accessToken ||
		req.header('Authorization')?.replace('Bearer ', '');

	if (!token) {
		throw new ApiError(401, 'Unauthorized request');
	}

	try {
		const decodedToken = jwt.verify(
			token,
			process.env.ACCESS_TOKEN_SECRET as string,
		) as JWTPayload;

		const user = await prisma.user.findUnique({
			where: {
				id: decodedToken.id,
			},
			select: {
				id: true,
				email: true,
				role: true,
				name: true,
				createdAt: true,
				status: true,
			},
		});

		if (!user) {
			throw new ApiError(401, 'Invalid Access Token');
		}
		if (user.status === 'inactive')
			throw new ApiError(403, 'Account is inactive');

		req.user = user;

		next();
	} catch (error) {
		const errorMessage = (error as any)?.message || 'Invalid access token';
		throw new ApiError(401, errorMessage);
	}
});
