import express from 'express';
import cors from 'cors';
import { PORT } from './lib/parseClient.js';
import customersRouter from './routes/customers.js';
import photosRouter from './routes/photos.js';
import galleriesRouter from './routes/galleries.js';
import siteRouter from './routes/site.js';
import aiRouter from './routes/ai.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/customers', customersRouter);
app.use('/api/photos', photosRouter);
app.use('/api/galleries', galleriesRouter);
app.use('/api/site', siteRouter);
app.use('/api/ai', aiRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: err.message || 'Error inesperado' });
});

const start = () => {
  app.listen(PORT, () => {
    console.log(`Servidor listo en http://localhost:${PORT}`);
  });
};

const isDirectRun = process.argv[1] && process.argv[1].endsWith('index.js');

if (isDirectRun) {
  start();
}

export { app, start };
