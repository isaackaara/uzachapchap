import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler';
import authRouter from './routes/auth';
import productsRouter from './routes/products';
import customersRouter from './routes/customers';
import ordersRouter from './routes/orders';
import channelsRouter from './routes/channels';
import analyticsRouter from './routes/analytics';
import webhooksRouter from './routes/webhooks';
import { startJobWorker } from './services/jobs.service';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));

// Raw body for webhook signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use('/auth', limiter);

app.use('/auth', authRouter);
app.use('/products', productsRouter);
app.use('/customers', customersRouter);
app.use('/orders', ordersRouter);
app.use('/channels', channelsRouter);
app.use('/analytics', analyticsRouter);
app.use('/webhooks', webhooksRouter);

app.use(errorHandler as express.ErrorRequestHandler);

app.listen(PORT, () => {
  console.log(`UzaChapChap backend running on port ${PORT}`);
  startJobWorker();
});
