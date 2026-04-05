import { env } from 'node:process';
import app from './app.js';

const PORT = env.PORT || 8000;

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
