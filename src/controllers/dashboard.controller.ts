import { asyncHandler } from '../utils/asyncHandler';
import prisma from '../lib/prisma';
import { ApiResponse } from '../utils/ApiResponse';

const getDashboardSummary = asyncHandler(async (req, res) => {
	// using a promise.all to fetch all the required data in parallel for better performance
	const [creditResult, debitResult, categoryTotals, recentActivity] =
		await Promise.all([
			prisma.financialRecord.aggregate({
				where: { isDeleted: false, type: 'credit' },
				_sum: { amount: true },
			}),
			prisma.financialRecord.aggregate({
				where: { isDeleted: false, type: 'debit' },
				_sum: { amount: true },
			}),
			prisma.financialRecord.groupBy({
				by: ['category', 'type'],
				where: { isDeleted: false },
				_sum: { amount: true },
				orderBy: { _sum: { amount: 'desc' } },
			}),
			prisma.financialRecord.findMany({
				where: { isDeleted: false },
				orderBy: { createdAt: 'desc' },
				take: 10,
			}),
		]);

	const totalIncome = creditResult._sum.amount ?? 0;
	const totalExpenses = debitResult._sum.amount ?? 0;
	const netBalance = totalIncome - totalExpenses;

	return res.status(200).json(
		new ApiResponse(
			200,
			{
				totalIncome,
				totalExpenses,
				netBalance,
				categoryWiseTotals: categoryTotals.map((c) => ({
					category: c.category,
					type: c.type,
					total: c._sum.amount ?? 0,
				})),
				recentActivity,
			},
			'Dashboard summary fetched successfully',
		),
	);
});

export default { getDashboardSummary };
