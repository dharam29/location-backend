import { createLogger, format, transports } from 'winston';
import path from 'path';
import moment from 'moment';
import axios from 'axios';

const winston = require('winston');
// require('winston-daily-rotate-file');

import { DATE_FORMAT } from './constant';

let webhookURL = 'https://fourtysevenbillion.webhook.office.com/webhookb2/73032150-2edd-4d26-ac96-ed4455af52db@f47a48fd-3a59-4131-b9c0-cfdad78da389/IncomingWebhook/9651ade02c0b45749c3dcfbee4a2701f/8b806d0d-ed90-4f26-b272-163532136e9a';

// const logDir = process.env.HOME + "text-log";
// const dailyRotateFileTransport = filename => new transports.DailyRotateFile({
//   filename: `text/%DATE%-${filename}.log`,
//   maxSize: "1g",
//   maxDays: "3d",
//   zippedArchive: true,
//   datePattern: 'YYYY-MM-DD'
// });

const getLabel = (callingModule) => {
  const parts = callingModule.split('/');
  return `${parts[parts.length - 2]}/${parts.pop()}`;
};

const postMessageToTeams = format.printf( async ({ level, message, timestamp }) => {
  try {
    let msg = `${timestamp} : ${message}`;  
    if(level === 'debug'){      
      const msgBody = {text: msg}
      const response = await axios.post(webhookURL, JSON.stringify(msgBody), {
        headers: {
          'content-type': 'application/json'
        },
      })
      .then(function (response) {
        // console.log(response);
      })
      .catch(function (error) {
        console.log(`Post Message To Teams--> ${error}`);
      });
      // console.log('response-->',response);
      return `${response.status} - ${response.statusText}`;
    }
  }
  catch (err) {
    return err;
  }    
});

const Logger = (filename) => {
  return createLogger({
    // const logger =  createLogger({
    level: 'info',
    format: winston.format.combine(
      format.timestamp({
        format: moment().format(DATE_FORMAT.DATE_FORMAT_YYYY_MM_DD), // CONSTANTS.DATE_FORMAT_YYYY_MM_DD
      }),
      format.printf((info) => `${filename} ${info.timestamp} ${info.level}: ${info.message}`),
      format.printf((info) => `${moment().format(DATE_FORMAT.DATE_FORMAT_YYYY_MM_DD)} ${info.level}: ${info.message}`),
      format.json(),
      postMessageToTeams
    ),
    label: path.basename(module.filename),
    transports: [
      new transports.Console({
        label: getLabel(filename), // path.basename(module.filename),
        level: 'debug',
        format: winston.format.combine(
          format.colorize(),

          format.printf((debug) => `${filename} ${debug.timestamp} ${debug.level}: ${debug.message}`),
          format.printf(
            (debug) =>
              `${moment().format(DATE_FORMAT.DATE_FORMAT_YYYY_MM_DD)} ${getLabel(filename)} ${debug.level}: ${
                debug.message
              }`
          ),
          // format.label({ label: path.basename(process.mainModule.filename) })
          format.label({ label: getLabel(filename) })
        ),
      }),
      // dailyRotateFileTransport(filename)
    ],
  });
};

export { Logger };
// level -- error > warn > info > verbose > debug > silly
