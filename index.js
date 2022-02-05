require('dotenv/config');
const http = require('http');
const cors = require('cors');
const express = require('express');
const bodyParser = require('body-parser');
const router = require('./src/app/routes');
const { END_PATH } = require('./src/utils/constant');
const { Logger } = require('./src/utils/logger');

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