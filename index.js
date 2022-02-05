import http from 'http';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';

import router from './src/app/routes/index';
import { END_PATH } from './src/utils/constant';
import { Logger } from './src/utils/logger';

const logger = Logger(module.filename);
const PORT = process.env.PORT || 8090;
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Cache-Control, Pragma, Origin, Authorization, Content-Type, Content-Disposition, X-Requested-With'
  );
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
  return next();
});

app.use('/', router);

const httpServer = http.createServer(app);
// logger.info(`Domain Host --> ${process.env.DOMAIN_HOST} ${process.env.PROTOCOL}`);

httpServer.listen({ port: PORT }, () => {
  logger.info(`🚀 Location server ready at http://localhost:${PORT}`);
});