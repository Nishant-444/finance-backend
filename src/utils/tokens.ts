import jwt from 'jsonwebtoken';

export const generateAccessToken = (user: {
	id: string;
	email: string;
	role: string;
}) => {
	return jwt.sign(
		{
			id: user.id,
			email: user.email,
			role: user.role,
		},
		process.env.ACCESS_TOKEN_SECRET as string,
		{ expiresIn: process.env.ACCESS_TOKEN_EXPIRY } as any,
	);
};

export const generateRefreshToken = (userId: string) => {
	return jwt.sign(
		{ id: userId },
		process.env.REFRESH_TOKEN_SECRET as string,
		{
			expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
		} as any,
	);
};
