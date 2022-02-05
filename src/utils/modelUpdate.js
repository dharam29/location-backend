/* eslint-disable import/prefer-default-export */
import { UploadFileModel, UserSecurityModel } from '../data/models';
import { Logger } from './logger';

const logger = Logger(module.filename);

export const updateFile = async (updateInput, whereCondition) => {
  try {
    return await UploadFileModel.update(updateInput, { where: whereCondition });
  } catch (error) {
    throw new Error(`Unable to update file --> ${error}`);
  }
};

export const updateUserSecurity = async (updateInput, whereCondition) => {
  try {
    return await UserSecurityModel.update(updateInput, { where: whereCondition });
  } catch (error) {
    throw new Error(`Unable to update user security --> ${error}`);
  }
};
