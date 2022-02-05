import db from '../data/sequelize_connection';
import { Logger } from './logger';

const logger = Logger(module.filename);

// Checking for table existing or not
// eslint-disable-next-line import/prefer-default-export
export const isModelExisting = async (modelName) => {
  let isExist = true;
  const DocParserQuery = `SELECT to_regclass('${modelName}')`;
  const docParserData = await db.query(DocParserQuery, {
    type: db.QueryTypes,
    logging: false,
  });

  if (docParserData[0].to_regclass === null) {
    isExist = false;
  }

  if (!isExist) {
    logger.error(`Is Model Existing -> Not existing --> ${modelName}`);
    throw new Error(`Model Table not exist error -> ${modelName}`);
  }
  return isExist;
};
