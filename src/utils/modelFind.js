/* eslint-disable import/prefer-default-export */
import sequelize from 'sequelize';

const { Op } = sequelize;
import {
  ProcessingClassesModel,
  PipelineDefinitionsModel,
  OrganizationModel,
  UploadFileModel,
  CasesModel,
  RoleModel,
  UserModel,
  CaseViewModel,
  FileViewModel,
  PROutputModel,
  UserSecurityModel,
  RegressionGoldDataModel,
  UiSettingGroupConfigModel,
  PipelineStageParameterConfigModel
} from '../data/models';
import { Logger } from './logger';
import db from '../data/sequelize_connection';

const logger = Logger(module.filename);

export const caseFindOne = async (whereCondition) => {
  try {
    const caseData = await CasesModel.findOne({ where: whereCondition, logging: false });
    if (!caseData) {
      throw new Error('Case Not Found.');
    }
    return caseData;
  } catch (err) {
    throw new Error(err);
  }
};

export const caseViewFindOne = async (whereCondition) => {
  try {
    const caseViewData = await CaseViewModel.findOne({ where: whereCondition, logging: false });
    if (!caseViewData) {
      throw new Error('Case View Not Found.');
    }
    return caseViewData;
  } catch (err) {
    throw new Error(err);
  }
};

export const caseViewFindAll = async (whereCondition) => {
  try {
    const caseViewData = await CaseViewModel.findAll({ where: whereCondition, logging: false, raw: true });
    if (!caseViewData) {
      throw new Error('Case View Not Found.');
    }
    return caseViewData;
  } catch (err) {
    throw new Error(err);
  }
};

export const fileViewFindAll = async (whereCondition) => {
  try {
    const fileViewData = await FileViewModel.findAll({ where: whereCondition, logging: false });
    return fileViewData;
  } catch (err) {
    throw new Error(err);
  }
};

export const caseViewFindExistCheck = async (whereCondition) => {
  try {
    const caseViewData = await CaseViewModel.findOne({ where: whereCondition, logging: false });
    if (caseViewData) {
      throw new Error('Case Already Exist.');
    }
    return caseViewData;
  } catch (err) {
    throw new Error(err);
  }
};

export const PipelineDefinitionsFindWithExistCheck = async (whereCondition) => {
  try {
    const pipelineDefinitionData = await PipelineDefinitionsModel.findOne({
      attributes: ['definition'],
      where: whereCondition,
      logging: false,
    });
    if (!pipelineDefinitionData) {
      throw new Error('Pipeline Not Found.');
    }
    return pipelineDefinitionData;
  } catch (err) {
    throw new Error(`${err}`);
  }
};

export const pipelineDefinitionsFindOne = async (whereCondition) => {
  const pipelineDefinitionData = await PipelineDefinitionsFindWithExistCheck(whereCondition);
  if (!pipelineDefinitionData) {
    throw new Error('Pipeline Not Found.');
  }
  return pipelineDefinitionData;
};

export const roleFindOne = async (whereCondition) => {
  try {
    const roleData = await RoleModel.findOne({ where: whereCondition, logging: false });
    if (!roleData) {
      throw new Error('You are not Authorized User.');
    }
    return roleData;
  } catch (err) {
    throw new Error(err);
  }
};

export const processingClassFindOne = async (whereCondition) => {
  try {
    const processingClassData = await ProcessingClassesModel.findOne({ where: whereCondition, logging: false });
    if (!processingClassData) {
      throw new Error('Processing Class Not Found.');
    }
    return processingClassData;
  } catch (err) {
    throw new Error(err);
  }
};

export const processingClassFindAll = async (whereCondition) => {
  try {
    const processingClassData = await ProcessingClassesModel.findAll({ where: whereCondition, logging: false });
    return processingClassData;
  } catch (err) {
    throw new Error(err);
  }
};

export const processingClassFindWithExistCheck = async (whereCondition) => {
  const processingClassData = await processingClassFindOne(whereCondition);
  if (!processingClassData) {
    throw new Error('Processing Class Not Found.');
  }
  return processingClassData;
};

export const userFindOne = async (whereCondition) => {
  try {
    const userData = await UserModel.findOne({ where: whereCondition , logging: false});
    if (!userData) {
      throw new Error('You are not Authorized User.');
    }
    if(userData.isDeleted){
      throw new Error('The User Is Deleted.');
    }
    if (!userData.enabled) {
      throw new Error('You Do not Have Appropriate Permission.');
    }
    return userData;
  } catch (err) {
    throw new Error(err);
  }
};

export const loginUserFindOne = async (whereCondition) => {
  try {
    const userData = await UserModel.findOne({ where: whereCondition, logging: false });
    if (!userData) {
      throw new Error('Email is not existing/active.');
    }
    return userData;
  } catch (err) {
    throw new Error(err);
  }
};

export const updateFileStatus = async (updateInput, whereCondition) => {
  try {
    const uploadFileModelData = await UploadFileModel.update(updateInput, { where: whereCondition });
    return uploadFileModelData;
  } catch (err) {
    throw new Error(err);
  }
};

export const fileFindOne = async (whereCondition) => {
  try {
    const fileData = await UploadFileModel.findOne({ where: whereCondition, logging: false });
    if (!fileData) {
      throw new Error(`File ${whereCondition} Not Found.`);
    }
    return fileData.dataValues;
  } catch (err) {
    throw new Error(err);
  }
};

export const fileFindAll = async (whereCondition) => {
  try {
    const fileData = await UploadFileModel.findAll({ where: whereCondition, logging: false });
    return fileData;
  } catch (err) {
    throw new Error(err);
  }
};

export const casesFindAll = async (whereCondition) => {
  try {
    const caseData = await CasesModel.findAll({ where: whereCondition, logging: false });
    return caseData;
  } catch (err) {
    throw new Error(err);
  }
};

export const casesFindOne = async (whereCondition) => {
  try {
    const caseData = await CasesModel.findOne({ where: whereCondition, logging: false });
    return caseData;
  } catch (err) {
    throw new Error(err);
  }
};

export const fileViewFindOne = async (whereCondition) => {
  try {
    const fileViewdata = await FileViewModel.findOne({ where: whereCondition, logging: false });
    if (!fileViewdata) {
      throw new Error(`File ${whereCondition} Not Found.`);
    }
    return fileViewdata;
  } catch (err) {
    throw new Error(err);
  }
};

export const fileViewWithCount = async (whereCondition, sortKey, sortValue, offset, limit) => {
  try {
    const fileViewData = await FileViewModel.findAndCountAll({
      offset,
      limit,
      where: { [Op.and]: whereCondition },
      order: [[sortKey, sortValue]],
      logging: false,
    });
    return fileViewData;
  } catch (err) {
    throw new Error(err);
  }
};

export const userSecurityFindOne = async (whereCondition) => {
  try {
    const userSecurityData = await UserSecurityModel.findOne({ where: whereCondition, logging: false });
    return userSecurityData;
  } catch (err) {
    throw new Error(err);
  }
};

export const organizationFindOne = async (whereCondition) => {
  try {
    const orgData = await OrganizationModel.findOne({ where: whereCondition, logging: false });
    if (!orgData) {
      throw new Error(`Organization Not Found.`);
    }
    return orgData;
  } catch (err) {
    throw new Error(err);
  }
};

export const pickFileData = async (ctx) => {
  const { userId, orgId } = ctx;
  let fileData = [];
  const dbQuery = `SELECT id, pipeline_status, process_id, case_id FROM file_list WHERE  pipeline_status @> '[{"userId": ${userId}, "submittedOn": ""}]' and status LIKE 'PICKED%' and org_id = ${orgId};`;

  fileData = await db.query(dbQuery, { type: db.QueryTypes.SELECT });
  if (Object.keys(fileData).length === 0) {
    return fileData;
  } else {
    return JSON.parse(JSON.stringify(fileData));
  }
};

export const prOutputFindAll = async (whereCondition) => {
  try {
    const prOutputData = await PROutputModel.findAll({ where: whereCondition, logging: false });
    if (prOutputData.length === 0) {
      throw new Error('No data found in PR output table.');
    }
    return prOutputData;
  } catch (err) {
    throw new Error(err);
  }
};

export const regressionFindOne = async (whereCondition) => {
  try {
    const regressionData = await RegressionGoldDataModel.findOne({ where: whereCondition, logging: false });
    return regressionData;
  } catch (err) {
    throw new Error(err);
  }
};

export const destroyCase = async (whereCondition, transaction) => {
  try {
    const caseData = await CasesModel.destroy({ where: whereCondition, transaction });
    if (caseData === 0) {
      throw new Error(`Case not found`);
    }
    return caseData;
  } catch (err) {
    throw new Error(err);
  }
};

export const destroyFile = async (whereCondition, transaction) => {
  try {
    const fileData = await UploadFileModel.destroy({ where: whereCondition, transaction });
    if (fileData === 0) {
      throw new Error(`File not found`);
    }
    return fileData;
  } catch (err) {
    throw new Error(err);
  }
};

export const uiSettingConfigFindAll = async (whereCondition) => {
  try {
    return await UiSettingGroupConfigModel.findAll({ where: whereCondition, attributes: {exclude: ['parameters']} });
  } catch (err) {
    throw new Error(err);
  }
};

export const pipelineStageParameterConfigFindOne = async (whereCondition) => {
  try {
    return await PipelineStageParameterConfigModel.findOne({ where: whereCondition });
  } catch (err) {
    throw new Error(err);
  }
};

export const pipelineStageParameterConfigFindAll = async () => {
  try {
    return await PipelineStageParameterConfigModel.findAll();
  } catch (err) {
    throw new Error(err);
  }
};

export const uiSettingConfigFindOne = async (whereCondition) => {
  try {
    return await UiSettingGroupConfigModel.findOne({ where: whereCondition });
  } catch (err) {
    throw new Error(err);
  }
};