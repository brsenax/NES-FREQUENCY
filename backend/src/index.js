import express from 'express';
import cors from 'cors';
import { corsOrigins } from './config.js';
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import disciplinasRoutes from './routes/disciplinas.js';
import sessoesRoutes from './routes/sessoes.js';
import checkinRoutes from './routes/checkin.js';
import relatoriosRoutes from './routes/relatorios.js';

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 8000;

app.use(cors({ origin: corsOrigins, credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/disciplinas', disciplinasRoutes);
app.use('/api/sessoes', sessoesRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/relatorios', relatoriosRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use((req, res) => {
  res.status(404).json({ detail: 'Endpoint não encontrado' });
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend rodando na porta ${port}`);
});
