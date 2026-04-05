import z from 'zod';
import { ApiError } from '../utils/ApiError';
import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../lib/prisma';
import { ApiResponse } from '../utils/ApiResponse';
import type { Prisma } from '../generated/prisma/client';

const createRecord = asyncHandler(async (req, res) => {
	const createRecordSchema = z.object({
		amount: z.number().positive(),
		type: z.enum(['credit', 'debit']),
		category: z.string().min(1),
		date: z.iso.datetime(),
		notes: z.string().optional(),
	});
	const parsed = createRecordSchema.safeParse(req.body);
	if (!parsed.success) {
		throw new ApiError(422, parsed.error.issues[0]?.message);
	}
	const { amount, type, category, notes } = parsed.data;

	try {
		const newRecord = await prisma.financialRecord.create({
			data: {
				userId: req.user!.id,
				amount,
				type,
				category,
				date: new Date(parsed.data.date),
				...(notes && { notes }), // equivalent to -> notes ? { notes: notes } : {}
			},
		});
		return res
			.status(201)
			.json(
				new ApiResponse(
					201,
					newRecord,
					'Financial record created successfully',
				),
			);
	} catch (error) {
		throw new ApiError(500, 'Error creating financial record');
	}
});

const getRecords = asyncHandler(async (req, res) => {
	const { startDate, endDate, type, category } = req.query as {
		startDate?: string;
		endDate?: string;
		type?: string;
		category?: string;
	};

	if (type && !['credit', 'debit'].includes(type)) {
		throw new ApiError(400, 'Invalid type. Must be credit or debit');
	}
	if (startDate && isNaN(new Date(startDate).getTime())) {
		throw new ApiError(400, 'Invalid startDate');
	}
	if (endDate && isNaN(new Date(endDate).getTime())) {
		throw new ApiError(400, 'Invalid endDate');
	}
	if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
		throw new ApiError(400, 'startDate cannot be after endDate');
	}

	const where: Prisma.FinancialRecordWhereInput = {
		isDeleted: false,
		...(type && { type: type as 'credit' | 'debit' }),
		...(category && { category: { contains: category } }),
		...((startDate || endDate) && {
			date: {
				...(startDate && { gte: new Date(startDate) }),
				...(endDate && { lte: new Date(endDate) }),
			},
		}),
	};

	const records = await prisma.financialRecord.findMany({
		where,
		orderBy: { date: 'desc' },
	});

	return res
		.status(200)
		.json(
			new ApiResponse(
				200,
				{ count: records.length, records },
				'Records fetched successfully',
			),
		);
});

const updateRecord = asyncHandler(async (req, res) => {
	// only admin can update records
	const recordId = req.params.id as string;
	const updateRecordSchema = z.object({
		amount: z.number().positive().optional(),
		type: z.enum(['credit', 'debit']).optional(),
		category: z.string().min(1).optional(),
		date: z.iso.datetime().optional(),
		notes: z.string().optional(),
	});
	const parsed = updateRecordSchema.safeParse(req.body);
	if (!parsed.success) {
		throw new ApiError(422, parsed.error.issues[0]?.message);
	}
	const { amount, type, category, date, notes } = parsed.data;

	try {
		const existingRecord = await prisma.financialRecord.findUnique({
			where: { id: recordId },
		});
		if (!existingRecord || existingRecord.isDeleted) {
			throw new ApiError(404, 'Financial record not found');
		}

		const updatedRecord = await prisma.financialRecord.update({
			where: { id: recordId },
			data: {
				...(amount !== undefined && { amount }),
				...(type && { type }),
				...(category && { category }),
				...(date && { date: new Date(date) }),
				...(notes && { notes }),
			},
		});
		return res
			.status(200)
			.json(
				new ApiResponse(
					200,
					updatedRecord,
					'Financial record updated successfully',
				),
			);
	} catch (error) {
		if (error instanceof ApiError) {
			throw error;
		}
		throw new ApiError(500, 'Error updating financial record');
	}
});

const deleteRecord = asyncHandler(async (req, res) => {
	const recordId = req.params.id as string;

	const existingRecord = await prisma.financialRecord.findUnique({
		where: { id: recordId },
	});
	if (!existingRecord || existingRecord.isDeleted) {
		throw new ApiError(404, 'Financial record not found');
	}

	await prisma.financialRecord.update({
		where: { id: recordId },
		data: { isDeleted: true },
	});

	return res
		.status(200)
		.json(new ApiResponse(200, {}, 'Financial record deleted successfully'));
});

export default {
	createRecord,
	getRecords,
	updateRecord,
	deleteRecord,
};
