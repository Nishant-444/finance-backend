import { z } from 'zod';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../lib/prisma';
import { ApiResponse } from '../utils/ApiResponse';

const getUsers = asyncHandler(async (req, res) => {
	const users = await prisma.user.findMany({
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			createdAt: true,
		},
		orderBy: { createdAt: 'desc' },
	});

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ count: users.length, users },
				'Users fetched successfully',
			),
		);
});

const getUserById = asyncHandler(async (req, res) => {
	const userId = req.params.id as string;

	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			createdAt: true,
		},
	});

	if (!user) {
		throw new ApiError(404, 'User not found');
	}

	return res
		.status(200)
		.json(new ApiResponse(200, user, 'User fetched successfully'));
});

const updateUserRole = asyncHandler(async (req, res) => {
	const userId = req.params.id as string;
	if (userId === req.user!.id) {
		throw new ApiError(400, 'You cannot change your own role');
	}

	const updateRoleSchema = z.object({
		role: z.enum(['viewer', 'analyst', 'admin']),
	});
	const parsed = updateRoleSchema.safeParse(req.body);
	if (!parsed.success) {
		throw new ApiError(422, parsed.error.issues[0]?.message);
	}

	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});
	if (!existingUser) {
		throw new ApiError(404, 'User not found');
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { role: parsed.data.role },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			createdAt: true,
		},
	});

	return res
		.status(200)
		.json(new ApiResponse(200, updatedUser, 'User role updated successfully'));
});

const updateUserStatus = asyncHandler(async (req, res) => {
	const userId = req.params.id as string;
	if (userId === req.user!.id) {
		throw new ApiError(400, 'You cannot change your own status');
	}

	const updateStatusSchema = z.object({
		status: z.enum(['active', 'inactive']),
	});
	const parsed = updateStatusSchema.safeParse(req.body);
	if (!parsed.success) {
		throw new ApiError(422, parsed.error.issues[0]?.message);
	}

	const existingUser = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});
	if (!existingUser) {
		throw new ApiError(404, 'User not found');
	}

	const updatedUser = await prisma.user.update({
		where: { id: userId },
		data: { status: parsed.data.status },
		select: {
			id: true,
			name: true,
			email: true,
			role: true,
			status: true,
			createdAt: true,
		},
	});

	return res
		.status(200)
		.json(
			new ApiResponse(200, updatedUser, 'User status updated successfully'),
		);
});

export default {
	getUsers,
	getUserById,
	updateUserRole,
	updateUserStatus,
};
