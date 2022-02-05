/* eslint-disable import/prefer-default-export */

import { CasesModel, ProcessingClassesModel } from '../data/models';
import { NotFound } from './msgContent';
import { Logger } from './logger';

const logger = Logger(module.filename);
const ProcessingClassFoundError = `Processing Class ${NotFound}`;
const CaseNotFoundError = `Case ${NotFound}`;
const uploadWarning = 'Can not upload file in processed case.';

export const processingClassFindOne = async (processingClass) => {
  try {
    const processingClassData = await ProcessingClassesModel.findOne({ where: { processingClass }, logging: false });
    if (!processingClassData) {
      return { error: ProcessingClassFoundError };
    }
    return processingClassData;
  } catch (err) {
    throw new Error('Processing Class Model Error.');
  }
};

export const caseFindOne = async (caseId) => {
  try {
    const caseData = await CasesModel.findOne({
      where: { id: caseId },
      logging: false,
    });
    if (!caseData) {
      logger.error(`Case Find One --> No Case Found caseId: ${caseId}`);
      return { error: CaseNotFoundError };
    }
    return caseData;
  } catch (e) {
    logger.error(`Case Find One Error --> No Case Found caseId: ${caseId} --> ${e}`);
    return { error: CaseNotFoundError };
  }
};

export const uploadValidation = async (req) => {
  const autoProcess = req.body.autoProcess === 'true';
  if (!autoProcess) {
    req.autoProcess = false;
    return req;
  }
  if (autoProcess && req.body.processingClass) {
    const processingClassData = await processingClassFindOne(req.body.processingClass);
    if (processingClassData.error) {
      return { error: processingClassData.error };
    }
    req.autoProcess = true;
    req.processingClassDefData = processingClassData;
    return req;
  }

  return { error: ProcessingClassFoundError };
};

export const uploadValidationForCase = async (req) => {
  const autoProcess = req.body.autoProcess === 'true';

  if (!req.body.caseId) {
    return { error: 'Case id not found.' };
  }
  if (!autoProcess && req.body.caseId) {
    const caseData = await caseFindOne(req.body.caseId);
    if (caseData.error) {
      return { error: caseData.error };
    }
    if (caseData.processingClass) {
      return { error: uploadWarning };
    }
    req.autoProcess = false;
    req.caseData = caseData;
    return req;
  }

  if (autoProcess && req.body.processingClass && req.body.caseId) {
    const caseData = await caseFindOne(req.body.caseId);
    if (caseData.error) {
      return { error: caseData.error };
    }
    if (caseData.processingClass) {
      return { error: uploadWarning };
    }

    const processingClassData = await processingClassFindOne(req.body.processingClass);
    if (processingClassData.error) {
      return { error: processingClassData.error };
    }
    req.caseData = caseData;
    req.processingClassDefData = processingClassData;
    req.autoProcess = true;
    return req;
  }
  return { error: ProcessingClassFoundError };
};
