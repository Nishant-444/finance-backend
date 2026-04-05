import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import bcrypt from 'bcryptjs';
import { generateAccessToken, generateRefreshToken } from '../utils/tokens.js';
import jwt, { type JwtPayload } from 'jsonwebtoken';

const generateAccessAndRefreshToken = async (userId: string) => {
	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) throw new ApiError(404, 'User not found');

	const accessToken = generateAccessToken({
		id: user.id,
		email: user.email,
		role: user.role,
	});
	const refreshToken = generateRefreshToken(user.id);

	await prisma.user.update({ where: { id: userId }, data: { refreshToken } });

	return { accessToken, refreshToken };
};

const register = asyncHandler(async (req, res) => {
	// validation
	const registerSchema = z.object({
		name: z.string().min(1),
		email: z.email(),
		password: z.string().min(8).max(16),
		role: z.enum(['viewer', 'analyst', 'admin']),
	});

	const parsed = registerSchema.safeParse(req.body);
	if (!parsed.success) {
		throw new ApiError(422, parsed.error.issues[0]?.message);
	}
	const { name, email, password, role } = parsed.data;

	// duplicate user check
	const existingUser = await prisma.user.findFirst({
		where: { email: email },
	});
	if (existingUser) {
		throw new ApiError(409, 'User with same email already exists');
	}

	try {
		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await prisma.user.create({
			data: {
				name,
				email: email.toLowerCase(),
				passwordHash: hashedPassword,
				role,
			},
		});
		const { passwordHash, refreshToken, ...safeUser } = user;
		return res
			.status(201)
			.json(new ApiResponse(201, safeUser, 'User registered successfully'));
	} catch (error) {
		throw new ApiError(500, 'Failed to register user');
	}
});

const login = asyncHandler(async (req, res) => {
	const { email, password } = req.body;

	if (!email || !password)
		throw new ApiError(400, 'Email && password required');
	const user = await prisma.user.findFirst({
		where: { email: email },
	});

	if (!user) throw new ApiError(404, 'User not Found!');

	const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
	if (!isPasswordValid) throw new ApiError(401, 'Invalid credentials');

	const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
		user.id,
	);

	// TODO: check if it returns actual password or hashed password
	const { passwordHash, refreshToken: rt, ...safeUser } = user;
	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ user: safeUser, accessToken, refreshToken },
				'Logged in successfully',
			),
		);
});

const logout = asyncHandler(async (req, res) => {
	if (!req.user?.id) throw new ApiError(401, 'Unauthorized');

	await prisma.user.update({
		where: { id: req.user.id },
		data: {
			refreshToken: null,
		},
	});

	return res
		.status(200)
		.json(new ApiResponse(200, {}, 'Logged out successfully'));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
	const incomingRefreshToken = req.body.refreshToken;

	if (!incomingRefreshToken)
		throw new ApiError(401, 'Refresh token is required');

	try {
		const decodedToken = jwt.verify(
			incomingRefreshToken,
			process.env.REFRESH_TOKEN_SECRET as string,
		) as JwtPayload;

		const user = await prisma.user.findUnique({
			where: { id: decodedToken.id },
		});

		if (!user || user.refreshToken !== incomingRefreshToken) {
			throw new ApiError(401, 'Invalid refresh token');
		}

		const { accessToken, refreshToken: newRefreshToken } =
			await generateAccessAndRefreshToken(user.id);

		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					{ accessToken, refreshToken: newRefreshToken },
					'Access token refreshed',
				),
			);
	} catch (error) {
		throw new ApiError(401, 'Invalid refresh token');
	}
});

export { register, login, logout, refreshAccessToken };
