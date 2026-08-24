import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import routes from './routes';
import { errorMiddleware } from './middleware/error.middleware';
import { UserModel } from './models/user.model';

const app = express();

app.get('/api/health', (_req, res) => {
  res.status(200).json({ message: 'API funcionando correctamente' });
});

app.get('/api/debug/users', async (_req, res) => {
  try {
    const users = await UserModel.findAll();
    res.json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ error: 'Error al consultar usuarios', details: (error as Error).message });
  }
});

app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use(errorMiddleware);

export default app;
