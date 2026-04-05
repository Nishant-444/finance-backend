import express from 'express';

import errorHandler from './middleware/error.middleware';

import authRouter from './routes/auth.routes';
import recordsRouter from './routes/records.routes';
import dashboardRouter from './routes/dashboard.routes';
import userRouter from './routes/users.routes';

const app = express();

app.use(express.json());

app.use('/api/v1/auth', authRouter);
app.use('/api/v1/records', recordsRouter);
app.use('/api/v1/dashboard', dashboardRouter);
app.use('/api/v1/users', userRouter);

// for any undefined routes
app.use((req, res) => {
	res.status(404).json({
		success: false,
		message: `Route ${req.method} ${req.path} not found`,
	});
});

// global error handler
app.use(errorHandler);

export default app;
