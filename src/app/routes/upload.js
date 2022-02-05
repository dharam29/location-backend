/* eslint-disable no-lonely-if */
/* eslint-disable no-param-reassign */
// eslint-disable-next-line import/no-extraneous-dependencies
import FormData from 'form-data';
import { StatusCodes } from 'http-status-codes';
import multer from 'multer';
import moment from 'moment';

import db from '../../data/sequelize_connection';
import fileUploadServer from './fileServer';
import { Logger } from '../../utils/logger';
import { fluentLogs } from '../../thirdparty/fluentbit';
import { autoPipelineSubmitApi, redisStatusUpdate } from './pipeline';
import { NotFound } from '../../utils/msgContent';
import { splitStr, joinStr, splitName } from '../../utils/strOperation';
import { apikeyVerify } from '../../middleware/authorized';
import { fileByCaseIdSubscription } from '../../utils/notification';
import {
  FILE_STATUS,
  NOTIFICATION_DEFAULT_DATA,
  FILE_STAGE,
  FILE_OPERATION,
  FLUENT_EVENT_TYPE,
} from '../../utils/constant';
import { UploadFileModel, CasesModel, ProcessingClassesModel, FileViewModel } from '../../data/models';

import { pipelineFlag } from '../../utils/pipelineFlag';
import { addMetaDataWithFile } from '../../utils/file';
import { uploadValidation, uploadValidationForCase } from '../../utils/validation';

const logger = Logger(module.filename);
const upload = multer().any();
const regex = /^[A-Za-z0-9\_]+$/g;

const sourceType =  FILE_STATUS.FILE_UPLOADED;
const ProcessingClassFoundError = `Processing Class ${NotFound}`;
const uploadSuccess = 'File uploaded successfully.';
const errorJsonMsg = { success: false, message: '' };

const userCtx = (req) => {
  const ctx = {
    email: req.email,
    orgId: req.orgId,
    orgName: req.orgName,
    role: req.role,
    userName: req.userName,
    userId: req.userId,
  };
  return ctx;
};

const qqFileName = async (qqfilename, fileInput) => {
  const str = qqfilename.split('.')[0];
  if (str.includes('_') && str.match(regex)) {
    const fileData = await splitName(str, '_');
    fileInput.jobId = fileData[0] || '';
  } else {
    fileInput.jobId = '';
  }
  return fileInput;
};

const appendMetaData = async (fileObj, externalMetaData) => {
  let metaDataObj = {};
  if (externalMetaData && typeof externalMetaData === 'object') {
    metaDataObj = externalMetaData;
  } else if (externalMetaData && typeof externalMetaData === 'string') {
    metaDataObj = JSON.parse(externalMetaData);
  }

  const externalMetaDataLength = Object.keys(metaDataObj).length;
  if (externalMetaDataLength > 0) {
    fileObj = await addMetaDataWithFile(fileObj, metaDataObj, externalMetaDataLength);
  } else {
    fileObj.metaData = {};
  }
  return fileObj;
};

const createFileInput = async (fileInput, { orgId, userId }, caseId, autoProcess, fileInCase) => {
  if (autoProcess) {
    fileInput.submittedOn = moment(new Date()).format();
    fileInput.stage = FILE_STAGE.AUTO_PROCESS;
    fileInput.caseId = caseId;
  }

  // fileInCase: true for autoUploadFileInCase, autoChunksDoneInCase
  if (fileInCase) {
    fileInput.caseId = caseId;
  }
  fileInput.uploadedAt = moment(new Date()).format();
  fileInput.status = FILE_STATUS.UPLOADED;
  fileInput.orgId = orgId;
  fileInput.sourceType = sourceType;
  fileInput.updatedBy = userId;
  return fileInput;
};

const uploadFileViewFindOne = async (whereCondition) => {
  try {
    logger.info(`Model File Find --> ${whereCondition} `);
    const fileViewdata = await FileViewModel.findOne({ where: whereCondition, logging: false });
    if (!fileViewdata) {
      return { error: 'Id not found in File View' };
    }
    return fileViewdata;
  } catch (err) {
    return { error: 'File View Model Error' };
  }
};

const caseCreate = async (req, transaction) => {
  try {
    const { configSet, processingClass } = req.processingClassDefData;
    const name = moment().valueOf();
    const casesData = await CasesModel.create({ name, orgId: req.orgId, processingClass, configSet }, { transaction });
    if (!casesData) {
      logger.error(`Case Create for auto upload Email:${req.email} OrgName: ${req.orgName} `);
      await transaction.rollback();
      return { error: `Case Not created` };
    }
    return casesData;
  } catch (err) {
    logger.debug(`Upload file Case create Email:${req.email} OrgName: ${req.orgName} Error: ${err} `);
    await transaction.rollback();
    return { error: err };
  }
};

export const autoUploadFileOnServer = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        logger.error(`Multer Upload File On Server Email: ${req.email} File: ${req.body.qqfilename} Error --> ${err}`);
        errorJsonMsg.message = `Multer error - ${err}`;
        return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const validationData = await uploadValidation(req);
      if (validationData.error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: validationData.error });
      }

      const pipelineFlagData = await pipelineFlag(req.body);

      const form = new FormData();
      const forceOcr = false;
      let fileInput;
      const { userId, role, orgId, userName, autoProcess } = req;

      const fileName = req.body.qqfilename;
      let folderName = splitStr(fileName, '.');
      folderName.pop();
      folderName = joinStr(folderName, '.');
      logger.info(`Folder Name Auto Upload File On Server Email: ${req.email} Folder Name --> ${folderName}`);
      // with chunks
      if (req && req.body && req.body.qqtotalparts) {
        form.append('qqpartindex', req.body.qqpartindex);
        form.append('qqpartbyteoffset', req.body.qqpartbyteoffset);
        form.append('qqchunksize', req.body.qqchunksize);
        form.append('qqtotalparts', req.body.qqtotalparts);
        form.append('dir', folderName);
      }
      // without chunks
      if (!req.body.qqtotalparts) {
        fileInput = { fileName, status: FILE_STATUS.UPLOADED };
        form.append('dir', folderName);
      }
      const { buffer } = req.files[0];
      form.append('qquuid', req.body.qquuid);
      form.append('qqfilename', req.body.qqfilename);
      form.append('qqtotalfilesize', req.body.qqtotalfilesize);
      form.append('qqfile', buffer, {
        filename: fileName,
      });

      const uploadData = await fileUploadServer(process.env.UPLOAD_URL, form);
      if (uploadData.error) {
        return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const transaction = await db.transaction();
      if (req && req.body && !req.body.qqtotalparts) {
        logger.info(`Upload file On Server Email: ${req.email} Data: ${JSON.stringify(uploadData)}`);
        // autoProcess - true
        if (autoProcess) {
          const casesData = await caseCreate(req, transaction);
          uploadData.file = process.env.FILE_URL + uploadData.file;
          fileInput = await createFileInput(fileInput, req, casesData.id, true, false);

          if (req.body.qqfilename) {
            const fileInputData = await qqFileName(req.body.qqfilename, fileInput);
            fileInput = fileInputData;
          }
          const uploadFileData = await UploadFileModel.create(fileInput, { transaction });

          const files = [];
          let fileObj = {};
          fileObj.id = uploadFileData.id;
          fileObj.filename = fileInput.fileName;
          fileObj.url = uploadData.file;
          fileObj.jobPriority = uploadFileData.priority;

          // append meta data in files array
          if (req.body.externalMetaData) {
            fileObj = await appendMetaData(fileObj, req.body.externalMetaData);
          } else {
            fileObj.metaData = {};
          }

          files.push(fileObj);
          const processData = await autoPipelineSubmitApi(files, casesData, req, forceOcr, pipelineFlagData);

          if (processData) {
            const updateInput = {};
            updateInput.processId = processData.processId;
            updateInput.updatedBy = userId;
            updateInput.updatedAt = moment(new Date()).format();
            updateInput.configSet = req.processingClassDefData.configSet;
            updateInput.processingClass = req.processingClassDefData.processingClass;
            updateInput.status = FILE_STATUS.SUBMITTED;
            updateInput.submittedOn = moment(new Date()).format();
            await UploadFileModel.update(updateInput, {
              where: {
                id: uploadFileData.id,
                caseId: casesData.id,
              },
              transaction,
              logging: false,
            });
            fileInput.processId = processData.processId;
            fileInput.id = uploadFileData.id;
          }

          const ctx = await userCtx(req);
          await redisStatusUpdate({
            header: ctx,
            isCase: false,
            orgId,
            caseId: casesData.id,
            priority: [5],
            processId: processData.processId ? processData.processId : null,
            fileId: [uploadFileData.id],
            operationType: FILE_STATUS.SUBMITTED,
          });
          await transaction.commit();
          return res.status(StatusCodes.OK).json(fileInput);
        } else {
          // autoProcess - false
          logger.info(`Auto Process False Auto Upload File On Server Email: ${req.email}`);
          fileInput.filePath = process.env.FILE_URL + uploadData.file;
          fileInput = await createFileInput(fileInput, req, '', false, false);

          if (req.body.qqfilename) {
            const fileInputData = await qqFileName(req.body.qqfilename, fileInput);
            fileInput = fileInputData;
          }
          const uploadFileData = await UploadFileModel.create(fileInput, { transaction });
          await transaction.commit();

          const details = { fileId: uploadFileData.dataValues.id, fileName: uploadFileData.dataValues.fileName };
          await fluentLogs(FLUENT_EVENT_TYPE.FILE_UPLOAD, { userId, orgId, role, userName }, details);
          return res.status(StatusCodes.OK).json({
            success: true,
            id: uploadFileData.id,
            filePath: uploadFileData.filePath,
            fileName: fileInput.fileName,
          });
        }
      } else {
        uploadData.success = true;
        await transaction.commit();
        return res.status(StatusCodes.OK).json(uploadData);
      }
    });
  } catch (e) {
    logger.debug(`Upload File Server Email: ${req.email} File: ${req.body.qqfilename} Error: ${e}`);
    errorJsonMsg.message = e;
    return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
  }
};

export const autoChunksdone = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        logger.error(`Multer Error Chunks Email: ${req.email} File: ${req.body.filename} Error: ${err}`);
        errorJsonMsg.message = `Multer error - ${err}`;
        return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const validationData = await uploadValidation(req);
      if (validationData.error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ success: false, message: validationData.error });
      }

      const pipelineFlagData = await pipelineFlag(req.body);

      const form = new FormData();
      const forceOcr = false;
      const fileName = req.body.qqfilename;
      const { userId, role, orgId, userName, autoProcess } = req;
      let folderName = splitStr(fileName, '.');

      folderName.pop();
      folderName = joinStr(folderName, '.');
      form.append('dir', folderName);
      form.append('qquuid', req.body.qquuid);
      form.append('qqfilename', req.body.qqfilename);
      form.append('qqtotalfilesize', req.body.qqtotalfilesize);
      form.append('qqtotalparts', req.body.qqtotalparts);
      let fileInput = { fileName: req.body.qqfilename };

      const chunkdata = await fileUploadServer(process.env.CHUNK_URL, form);
      if (chunkdata.error) {
        logger.error(`Upload Chunks Email: ${req.email} File: ${fileInput.fileName} Error --> ${chunkdata.error}`);
        errorJsonMsg.message = `${chunkdata.error}`;
        return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const transaction = await db.transaction();
      // autoProcess - true
      if (autoProcess) {
        const chunkData = { fileUrl: chunkdata.file, success: true };

        const casesData = await caseCreate(req, transaction);
        if (casesData.error) {
          return res.status(StatusCodes.BAD_REQUEST).json(casesData.error);
        }

        chunkData.fileUrl = process.env.FILE_URL + chunkData.fileUrl;
        fileInput.filePath = chunkdata.file;
        fileInput = await createFileInput(fileInput, req, casesData.id, true, false);

        if (req.body.qqfilename) {
          const fileInputData = await qqFileName(req.body.qqfilename, fileInput);
          fileInput = fileInputData;
        }
        logger.info(`File Input Auto Chunks done Email: ${req.email} File Input --> ${fileInput}`);
        const uploadFileData = await UploadFileModel.create(fileInput, { transaction });
        const updateInput = {};
        const files = [];
        let fileObj = {};
        fileObj.id = uploadFileData.id;
        fileObj.filename = fileInput.fileName;
        fileObj.url = chunkData.fileUrl;
        fileObj.jobPriority = uploadFileData.priority;

        // append meta data in files array
        if (req.body.externalMetaData) {
          fileObj = await appendMetaData(fileObj, req.body.externalMetaData);
        } else {
          fileObj.metaData = {};
        }
        // end metadata

        files.push(fileObj);
        // get Organization/Client name

        const processData = await autoPipelineSubmitApi(files, casesData, req, forceOcr, pipelineFlagData);

        if (processData) {
          updateInput.processId = processData.processId;
          updateInput.updatedAt = moment(new Date()).format();
          updateInput.submittedOn = moment(new Date()).format();

          await UploadFileModel.update(updateInput, {
            where: {
              id: uploadFileData.id,
              caseId: casesData.id,
            },
            transaction,
          });
        }

        const ctx = await userCtx(req);
        await redisStatusUpdate({
          header: ctx,
          isCase: false,
          orgId,
          priority: [5],
          caseId: casesData.id,
          processId: processData.processId ? processData.processId : null,
          fileId: [uploadFileData.id],
          operationType: FILE_STATUS.SUBMITTED,
        });

        await transaction.commit();
        res.status(StatusCodes.OK).json(updateInput);
      } else {
        // autoProcess - false
        if (req && req.body && req.body.qqtotalparts) {
          fileInput.filePath = process.env.FILE_URL + chunkdata.file;
          fileInput = await createFileInput(fileInput, req, '', false, false);

          if (req.body.qqfilename) {
            const fileInputData = await qqFileName(req.body.qqfilename, fileInput);
            fileInput = fileInputData;
          }

          const uploadChunkData = await UploadFileModel.create(fileInput, { transaction, logging: false });
          await transaction.commit();
          const details = { fileId: uploadChunkData.dataValues.id, fileName: uploadChunkData.dataValues.fileName };

          await fluentLogs(FLUENT_EVENT_TYPE.FILE_UPLOAD, { userId, orgId, role, userName }, details);
          res.status(StatusCodes.OK).json({
            success: true,
            id: uploadChunkData.id,
            filePath: uploadChunkData.filePath,
            fileName: uploadChunkData.fileName,
            processId: null,
            caseId: null,
          });
        } else {
          await transaction.commit();
          chunkdata.success = true;
          return res.status(StatusCodes.OK).json(chunkdata);
        }
      }
    });
  } catch (e) {
    logger.debug(`Catch Auto Chunks User Email -> ${req.email} File name -> ${req.body.qqfilename}  Error -> ${e}`);
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: e,
    });
  }
};

/**
 * @api {get} /api/v1/case/upload
 * @apiName autoUploadFileInCase
 * @apiRequest  { caseId, orgId } Int
 *
 * @apiSuccess {status} OK
 * @apiSuccess {statusCode} 200
 * @apiSuccess {success} TRUE
 * @apiSuccess {id} File Id
 * @apiSuccess {filePath} File Path
 * @apiSuccess {fileName} File Name
 */

//  file upload apis(autoUploadFileInCase, autoChunksDoneInCase) with new scenario (create Case: upload file)
export const autoUploadFileInCase = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        logger.error(`Multer Error Upload In Case Email: ${req.email} File: ${req.body.qqfilename} Error --> ${err}`);
        errorJsonMsg.message = `Multer error - ${err}`;
        return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const validationData = await uploadValidationForCase(req);
      if (validationData.error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: validationData.error });
      }

      logger.info(
        `Upload auto process File In Case Email: ${req.email} Type Of Auto Process --> ${typeof req.autoProcess}`
      );

      const pipelineFlagData = await pipelineFlag(req.body);

      const form = new FormData();
      const { userId, role, orgId, userName, autoProcess, caseData } = req;
      const forceOcr = false;
      let fileInput;

      const fileName = req.body.qqfilename;
      let folderName = splitStr(fileName, '.');

      folderName.pop();
      folderName = joinStr(folderName, '.');

      if (req && req.body && req.body.qqtotalparts) {
        form.append('qqpartindex', req.body.qqpartindex);
        form.append('qqpartbyteoffset', req.body.qqpartbyteoffset);
        form.append('qqchunksize', req.body.qqchunksize);
        form.append('qqtotalparts', req.body.qqtotalparts);
        form.append('dir', folderName);
      }
      if (!req.body.qqtotalparts) {
        fileInput = {
          fileName,
          status: FILE_STATUS.UPLOADED,
        };
        form.append('dir', folderName);
      }

      const { buffer } = req.files[0];
      form.append('qquuid', req.body.qquuid);
      form.append('qqfilename', req.body.qqfilename);
      form.append('qqtotalfilesize', req.body.qqtotalfilesize);
      form.append('qqfile', buffer, {
        filename: fileName,
      });

      const uploadData = await fileUploadServer(process.env.UPLOAD_URL, form);
      if (uploadData.error) {
        logger.error(
          `Upload File In Case Email: ${req.email} File: ${req.body.qqfilename} Error --> ${uploadData.error}`
        );
        errorJsonMsg.message = `${uploadData.error}`;
        return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const transaction = await db.transaction();
      if (req && req.body && !req.body.qqtotalparts) {
        logger.info(`Request Upload File In Case Email: ${req.email} Upload Data --> ${JSON.stringify(uploadData)}`);

        // autoProcess - true
        if (autoProcess) {
          logger.info(`Auto Process True Auto Upload File In Case`);
          const { processingClass, externalMetaData } = req.body;

          let isqqFileName = false;
          let qqfilename;
          if (req.body.qqfilename) {
            isqqFileName = true;
            qqfilename = req.body.qqfilename;
          }

          const fileInputRes = await fileAutoProcess(
            res,
            transaction,
            processingClass,
            req,
            caseData.id,
            uploadData,
            caseData,
            fileInput,
            isqqFileName,
            qqfilename,
            forceOcr,
            pipelineFlagData,
            externalMetaData
          );

          const ctx = await userCtx(req);
          await redisStatusUpdate({
            header: ctx,
            isCase: false,
            orgId,
            priority: caseData.priority,
            caseId: caseData.id,
            processId: fileInputRes.processId ? fileInputRes.processId : null,
            fileId: [fileInputRes.id],
            operationType: FILE_STATUS.SUBMITTED,
          });

          await transaction.commit();
          res.status(StatusCodes.OK).json(fileInputRes);
        } else {
          // autoProcess - false
          fileInput.filePath = process.env.FILE_URL + uploadData.file;
          fileInput = await createFileInput(fileInput, req, caseData.id, false, true);
          fileInput.priority = caseData.priority;

          if (req.body.qqfilename) {
            const fileInputData = await qqFileName(req.body.qqfilename, fileInput);
            fileInput = fileInputData;
          }

          const uploadFileData = await UploadFileModel.create(fileInput, { transaction, logging: false });
          const ctx = await userCtx(req);
          await redisStatusUpdate({
            header: ctx,
            isCase: false,
            orgId,
            caseId: caseData.id,
            priority: caseData.priority,
            processId: 'NA',
            fileId: [uploadFileData.id],
            operationType: FILE_STATUS.UPLOADED,
          });

          await transaction.commit();

          const fileUploadObj = await uploadFileViewFindOne({ id: uploadFileData.id });
          fileUploadObj.operation = FILE_OPERATION.ADD;
          await fileByCaseIdSubscription(fileUploadObj);

          const details = {
            fileId: uploadFileData.dataValues.id,
            fileName: uploadFileData.dataValues.fileName,
            caseId: parseInt(caseData.id, 10),
          };

          await fluentLogs(FLUENT_EVENT_TYPE.CASE_FILE_UPLOAD, { userId, orgId, role, userName, count: 1 }, details);

          res.status(StatusCodes.OK).json({
            success: true,
            message: uploadSuccess,
            id: fileUploadObj.id,
            filePath: fileUploadObj.filePath,
            fileName: fileInput.fileName,
          });
        }
      } else {
        await transaction.commit();
        uploadData.success = true;
        uploadData.message = uploadSuccess;
        res.status(StatusCodes.OK).json(uploadData);
      }
    });
  } catch (e) {
    logger.debug(`Catch Auto Upload File In Case Email: ${req.email} File: ${req.body.qqfilename} Error --> ${e}`);
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: e,
    });
  }
};

export const autoChunksDoneInCase = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      if (err) {
        logger.error(`Multer Error Chunks In Case Email: ${req.email} File: ${req.body.qqfilename} Error --> ${err}`);
        errorJsonMsg.message = `Multer error: ${err}`;
        res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const validationData = await uploadValidationForCase(req);
      if (validationData.error) {
        return res.status(StatusCodes.BAD_REQUEST).json({ message: validationData.error });
      }

      const pipelineFlagData = await pipelineFlag(req.body);

      const form = new FormData();
      const { userId, role, orgId, userName, autoProcess, caseData } = req; // Take from token
      const { caseId } = req.body;

      const forceOcr = false;
      const fileName = req.body.qqfilename;
      let folderName = splitStr(fileName, '.');

      folderName.pop();
      folderName = joinStr(folderName, '.');

      form.append('dir', folderName);
      form.append('qquuid', req.body.qquuid);
      form.append('qqfilename', req.body.qqfilename);
      form.append('qqtotalfilesize', req.body.qqtotalfilesize);
      form.append('qqtotalparts', req.body.qqtotalparts);

      let fileInput = {
        fileName: req.body.qqfilename,
      };

      const chunkdata = await fileUploadServer(process.env.CHUNK_URL, form);
      if (chunkdata.error) {
        logger.error(
          `Chunks Done In Case Email: ${req.email} File: ${req.body.qqfilename} Error --> ${chunkdata.error}`
        );
        errorJsonMsg.message = `${chunkdata.error}`;
        return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const transaction = await db.transaction();
      // autoProcess - true
      if (autoProcess) {
        const { externalMetaData } = req.body;
        const chunkData = { fileUrl: chunkdata.file, success: true };

        // update pipelineid in case model
        await CasesModel.update(
          {
            configSet: req.processingClassDefData.configSet,
            processingClass: req.processingClassDefData.processingClass,
          },
          {
            where: { id: caseId, orgId },
            transaction,
            logging: false,
          }
        );

        chunkData.fileUrl = process.env.FILE_URL + chunkData.fileUrl;

        // insert into uploadefile model
        fileInput.filePath = chunkdata.file;
        fileInput = await createFileInput(fileInput, req, caseId, true, true);
        fileInput.priority = caseData.priority;

        if (req.body.qqfilename) {
          const fileInputData = await qqFileName(req.body.qqfilename, fileInput);
          fileInput = fileInputData;
        }

        logger.info(`File Input Auto Chunks Done In Case Email: ${req.email} File Input --> ${fileInput}`);
        const uploadFileData = await UploadFileModel.create(fileInput, { transaction });

        const updateInput = {};
        const files = [];
        let fileObj = {};
        fileObj.id = uploadFileData.id;
        fileObj.filename = fileInput.fileName;
        fileObj.url = chunkData.fileUrl;
        fileObj.jobPriority = uploadFileData.priority;

        // append meta data in files array
        if (externalMetaData) {
          fileObj = await appendMetaData(fileObj, externalMetaData);
        } else {
          fileObj.metaData = {};
        }
        // end metadata

        files.push(fileObj);

        const processData = await autoPipelineSubmitApi(files, caseData, req, forceOcr, pipelineFlagData);
        if (processData) {
          logger.info(`Pipeline Process Chunks In Case Email: ${req.email} Process Data --> ${processData}`);

          updateInput.processId = processData.processId;
          updateInput.updatedBy = userId;
          updateInput.updatedAt = moment(new Date()).format();
          updateInput.configSet = req.processingClassDefData.configSet;
          updateInput.processingClass = req.processingClassDefData.processingClass;
          updateInput.status = FILE_STATUS.SUBMITTED;
          updateInput.submittedOn = moment(new Date()).format();
          fileInput.processId = processData.processId;

          await UploadFileModel.update(updateInput, {
            where: { id: uploadFileData.id, caseId },
            transaction,
          });

          const filesObj = await uploadFileViewFindOne({ id: uploadFileData.id });
          filesObj.dataValues.operation = FILE_OPERATION.ADD;
        }

        const ctx = await userCtx(req);
        await redisStatusUpdate({
          header: ctx,
          isCase: false,
          orgId,
          caseId: caseData.id,
          priority: caseData.priority,
          processId: processData.processId ? processData.processId : null,
          fileId: [uploadFileData.id],
          operationType: FILE_STATUS.SUBMITTED,
        });

        await transaction.commit();
        res.status(StatusCodes.OK).json(fileInput);
      } else {
        // autoProcess - false
        if (req && req.body && req.body.qqtotalparts) {
          fileInput.filePath = process.env.FILE_URL + chunkdata.file;
          fileInput = await createFileInput(fileInput, req, caseId, false, true);
          fileInput.priority = caseData.priority;
          if (req.body.qqfilename) {
            const fileInputData = await qqFileName(req.body.qqfilename, fileInput);
            fileInput = fileInputData;
          }

          const uploadChunkData = await UploadFileModel.create(fileInput, { transaction });

          NOTIFICATION_DEFAULT_DATA.orgId = orgId;
          NOTIFICATION_DEFAULT_DATA.fileId = uploadChunkData.id;

          await transaction.commit();

          const details = {
            fileId: uploadChunkData.dataValues.id,
            fileName: uploadChunkData.dataValues.fileName,
            caseId: parseInt(caseId, 10),
          };
          await fluentLogs(FLUENT_EVENT_TYPE.CASE_FILE_UPLOAD, { userId, orgId, role, userName, count: 1 }, details);

          const fileObj = await uploadFileViewFindOne({ id: uploadChunkData.id });

          fileObj.operation = FILE_OPERATION.ADD;

          await fileByCaseIdSubscription(fileObj);
          const ctx = await userCtx(req);
          await redisStatusUpdate({
            header: ctx,
            isCase: false,
            orgId,
            caseId,
            priority: caseData.priority,
            processId: 'NA',
            fileId: [uploadChunkData.dataValues.id],
            operationType: FILE_STATUS.UPLOADED,
          });

          return res.status(StatusCodes.OK).json({
            success: true,
            message: uploadSuccess,
            id: fileObj.id,
            filePath: fileObj.filePath,
            fileName: fileObj.fileName,
            processId: null,
            caseId: null,
          });
        } else {
          await transaction.commit();
          chunkdata.success = true;
          chunkdata.message = uploadSuccess;
          res.status(StatusCodes.OK).json(chunkdata);
        }
      }
    });
  } catch (e) {
    logger.debug(`Catch Chunks In Case Email: ${req.email} File: ${req.body.qqfilename} Error --> ${e}`);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: e,
    });
  }
};

const fileAutoProcess = async (
  res,
  transaction,
  processingClass,
  req,
  caseId,
  uploadData,
  casesData,
  fileInputObj,
  isqqFileName,
  qqfilename,
  forceOcr,
  pipelineFlagData,
  externalMetaData
) => {
  let fileInput = fileInputObj;

  const { userId } = req;
  const processingClassDefData = await ProcessingClassesModel.findOne({
    where: { processingClass },
    logging: false,
  });

  if (!processingClassDefData) {
    errorJsonMsg.message = `${ProcessingClassFoundError}`;
    await transaction.rollback();
    return res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
  }

  // update pipelineid in case model
  await CasesModel.update(
    {
      configSet: processingClassDefData.configSet,
      processingClass: processingClassDefData.processingClass,
    },
    { where: { id: caseId }, transaction, logging: false }
  );

  uploadData.file = process.env.FILE_URL + uploadData.file;

  // insert into uploadefile model
  fileInput.filePath = uploadData.file;
  fileInput.status = FILE_STATUS.SUBMITTED;
  fileInput = await createFileInput(fileInput, req, caseId, true, true);
  fileInput.priority = casesData.priority;

  if (isqqFileName) {
    const fileInputData = await qqFileName(qqfilename, fileInput);
    fileInput = fileInputData;
  }

  logger.info(`File Input File Auto Process Email: ${req.email} File Input --> ${JSON.stringify(fileInput)}`);
  const uploadFileData = await UploadFileModel.create(fileInput, { transaction });

  const files = [];
  let fileObj = {};
  fileObj.id = uploadFileData.id;
  fileObj.filename = fileInput.fileName;
  fileObj.url = uploadData.file;
  fileObj.jobPriority = uploadFileData.priority;

  // append meta data in files array
  if (externalMetaData) {
    fileObj = await appendMetaData(fileObj, externalMetaData);
  } else {
    fileObj.metaData = {};
  }
  // end metadata

  files.push(fileObj);
  const processData = await autoPipelineSubmitApi(files, casesData, req, forceOcr, pipelineFlagData);

  if (processData) {
    const updateInput = {};
    updateInput.processId = processData.processId;
    updateInput.updatedBy = userId;
    updateInput.updatedAt = moment(new Date()).format();
    updateInput.configSet = processingClassDefData.configSet;
    updateInput.processingClass = processingClassDefData.processingClass;
    updateInput.status = FILE_STATUS.SUBMITTED;
    updateInput.submittedOn = moment(new Date()).format();

    await UploadFileModel.update(updateInput, {
      where: { id: uploadFileData.id, caseId },
      transaction,
    });

    fileInput.processId = processData.processId;
    fileInput.id = uploadFileData.id;

    const filesObj = await UploadFileModel.findOne({
      where: { id: uploadFileData.id },
      logging: false,
    });

    filesObj.dataValues.operation = FILE_OPERATION.ADD;
  }
  return fileInput;
};

// Using Apikey uplaod file
export const uploadFile = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      await apikeyVerify(req);

      if (err) {
        logger.error(`Multer Error Upload File Email: ${req.email} File: ${req.body.qqfilename} Error --> ${err}`);
        errorJsonMsg.message = `Multer error - ${err}`;
        res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      logger.info(`Upload Request Upload File -->  Email: ${req.email} body: --> ${JSON.stringify(req.body)}`);
      const form = new FormData();
      const fileName = req.body.qqfilename;
      let folderName = splitStr(fileName, '.');

      folderName.pop();
      folderName = joinStr(folderName, '.');

      if (req && req.body && req.body.qqtotalparts) {
        form.append('qqpartindex', req.body.qqpartindex);
        form.append('qqpartbyteoffset', req.body.qqpartbyteoffset);
        form.append('qqchunksize', req.body.qqchunksize);
        form.append('qqtotalparts', req.body.qqtotalparts);
        form.append('dir', folderName);
      }
      if (!req.body.qqtotalparts) {
        form.append('dir', folderName);
      }

      const { buffer } = req.files[0];
      form.append('qquuid', req.body.qquuid);
      form.append('qqfilename', req.body.qqfilename);
      form.append('qqtotalfilesize', req.body.qqtotalfilesize);
      form.append('qqfile', buffer, {
        filename: fileName,
      });

      logger.info(`UPLOAD URL Upload File Email: ${req.email}`);
      const fileUploadData = await fileUploadServer(process.env.UPLOAD_URL, form);
      if (fileUploadData.error) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `${fileUploadData.error}`,
        });
      }
      return res.status(StatusCodes.OK).json(fileUploadData);
    });
  } catch (e) {
    logger.debug(`Catch Upload File Email: ${req.email} File: ${req.body.qqfilename} Error --> ${e}`);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: e,
    });
  }
};

// Using Apikey chunks file
export const chunkDoneFile = async (req, res) => {
  try {
    upload(req, res, async (err) => {
      await apikeyVerify(req);
      logger.info(`Chunk File Email: ${req.email} body --> ${JSON.stringify(req.body)}`);

      if (err) {
        logger.error(`Multer Error Chunk Done File Email: ${req.email} File: ${req.body.qqfilename} Error --> ${err}`);
        errorJsonMsg.message = `Multer error - ${err}`;
        res.status(StatusCodes.BAD_REQUEST).json(errorJsonMsg);
      }

      const form = new FormData();
      const fileName = req.body.qqfilename;
      let folderName = splitStr(fileName, '.');

      folderName.pop();
      folderName = joinStr(folderName, '.');

      form.append('dir', folderName);
      form.append('qquuid', req.body.qquuid);
      form.append('qqfilename', req.body.qqfilename);
      form.append('qqtotalfilesize', req.body.qqtotalfilesize);
      form.append('qqtotalparts', req.body.qqtotalparts);

      const fileChunkData = await fileUploadServer(process.env.CHUNK_URL, form);
      if (fileChunkData.error) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: `Upload Error --> ${fileChunkData.error}`,
        });
      }
      return res.status(StatusCodes.OK).json(fileChunkData);
    });
  } catch (e) {
    logger.debug(`Catch Chunk Done File Email: ${req.email} File: ${req.body.qqfilename} Error --> ${e}`);
    res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: e,
    });
  }
};
