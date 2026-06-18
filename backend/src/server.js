import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectDB } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './routes/auth.js';
import zonasRoutes from './routes/zonas.js';
import rutasRoutes from './routes/rutas.js';
import incidentesRoutes from './routes/incidentes.js';
import residuosRoutes from './routes/residuos.js';
import alertasRoutes from './routes/alertas.js';
import usuariosRoutes from './routes/usuarios.js';
import dniRoutes from './routes/dni.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.get('/api/health', (_req, res) => res.json({ success: true, data: { estado: 'ok' } }));

// Dashboard web de administrador (servido por el mismo backend)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.use('/api/auth', authRoutes);
app.use('/api/zonas', zonasRoutes);
app.use('/api/rutas', rutasRoutes);
app.use('/api/incidentes', incidentesRoutes);
app.use('/api/residuos', residuosRoutes);
app.use('/api/alertas', alertasRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/dni', dniRoutes);

const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(PORT, () => console.log(`API escuchando en puerto ${PORT}`)))
  .catch((e) => {
    console.error('No se pudo iniciar:', e.message);
    process.exit(1);
  });
