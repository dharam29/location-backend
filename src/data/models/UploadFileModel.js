import Sequelize from 'sequelize';
import db from '../sequelize_connection';
import { MODEL_NAME } from '../../utils/constant';

const UploadFileModel = db.define(
  MODEL_NAME.FILES,
  {
    id: {
      type: Sequelize.INTEGER,
      field: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    processId: {
      type: Sequelize.TEXT,
      field: 'process_id',
    },
    filePath: {
      type: Sequelize.TEXT,
      field: 'file_path',
    },
    sourcePath: {
      type: Sequelize.TEXT,
      field: 'source_path',
    },
    fileName: {
      type: Sequelize.TEXT,
      field: 'name',
    },
    status: {
      type: Sequelize.TEXT, // 'UPLOADED','COMPLETE', 'FAILED', 'PROCESSING'
      field: 'status',
    },
    stage: {
      type: Sequelize.TEXT,
      field: 'stage',
    },
    sourceType: {
      type: Sequelize.TEXT,
      field: 'source_type', // 'MINIO', 'FILE_UPLOADED', '{SOURCE}_REMOTE_{BUCKET}'
    },
    caseId: {
      type: Sequelize.INTEGER,
      field: 'case_id',
    },
    orgId: {
      type: Sequelize.INTEGER,
      field: 'org_id',
    },
    sha256: {
      type: Sequelize.TEXT,
      field: 'sha256',
    },
    priority: {
      type: Sequelize.INTEGER,
      field: 'priority',
      values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      defaultValue: 5,
    },
    updatedAt: {
      type: 'DATE',
      field: 'updated_at', // tempraroy using uploadedAt for submittedAt
    },
    uploadedAt: {
      type: 'DATE',
      field: 'uploaded_at',
    },
    submittedOn: {
      type: 'DATE',
      field: 'submitted_on',
    },
    finishedOn: {
      type: 'DATE',
      field: 'finished_on',
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      field: 'updated_by',
    },
    jobId: {
      type: Sequelize.TEXT,
      field: 'job_id',
    },
    loanNumber: {
      type: Sequelize.TEXT,
      field: 'loan_number',
    },
    elapsedTime: {
      type: Sequelize.INTEGER,
      field: 'elapsed_time',
    },
    pipelineStatus: {
      type: Sequelize.JSONB,
      field: 'pipeline_status',
    },
    configSet: {
      type: Sequelize.TEXT,
      field: 'config_set',
    },
    processingClass: {
      type: Sequelize.TEXT,
      field: 'processing_class',
    },
    isEscalate: {
      type: Sequelize.BOOLEAN,
      field: 'is_escalate',
    },
    isArchived: {
      type: Sequelize.BOOLEAN,
      field: 'is_archived',
    },
    reprocess: {
      type: Sequelize.BOOLEAN,
      field: 'reprocess',
      defaultValue: false,
    },
    bucketName: {
      type: Sequelize.TEXT,
      field: 'bucket_name',
    },
  },
  {
    freezeTableName: false,
    timestamps: false,
  }
);

export default UploadFileModel;
