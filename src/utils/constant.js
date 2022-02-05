const STATUS_OPTION = Object.freeze({
  SUCCESS: 'SUCCESS',
  FAILED: 'FAILED',
  COMPLETE: 'COMPLETE',
  RETRY: 'RETRYING',
  FAILURE: 'FAILURE',
});

const FILE_OPERATION = Object.freeze({
  ADD: 'ADD',
  UPDATE: 'UPDATE',
  REMOVE: 'REMOVE',
  UPDATE_STATUS: 'UPDATE_STATUS',
});

const TIME = Object.freeze({
  EXPIRE_TIME: 86400,
  REDIS_QUERY_EXPIRE_TIME: 5400,
});

const ROLE_OPTION = Object.freeze({
  BA: 'BA',
  EH: 'EH',
  QA: 'QA',
  API: 'API', 
});

const PERMISSION_OPTION = Object.freeze({
  UPDATE: 'UPDATE',
  GET: 'GET',
  UPLOAD: 'UPLOAD',
  DOWNLOAD: 'DOWNLOAD',
  DELETE: 'DELETE',
  ARCHIVE: 'ARCHIVE',
  UNARCHIVE: 'UNARCHIVE',
  QUEUE: 'QUEUE',
  CREATE: 'CREATE',
  COUNT: 'COUNT',
  MOVE: 'MOVE',
  MINIO: 'MINIO',
  PROCESS: 'PROCESS',
});

const OBJECT_OPTION = Object.freeze({
  CASE: 'CASE',
  FILE: 'FILE',
  USER: 'USER',
  DASHBOARD: 'DASHBOARD',
  ROLE: 'ROLE',
  PRIORITY: 'PRIORITY',
  CREATE_API_KEY:'CREATE_API_KEY',
  ORGANIZATION: 'ORGANIZATION',
  ORGANIZATION_LIST: 'ORGANIZATION_LIST',
  PROCESSING_CLASS: 'PROCESSING_CLASS',
  GOLD_DATA: 'GOLD_DATA',
  PIPELINE: 'PIPELINE',
});

const END_PATH = Object.freeze({
  GRAPHQL_PATH: '/api/nextgen/graphql',
});

const HEADER_CONTENT_TYPE = Object.freeze({
  RESPONSE_CONTENT_TYPE: { 'response-content-type': 'text/html' },
  APPLICATION_JSON: { 'Content-Type': 'application/json' },
  TEXT_HTML: { 'Content-Type': 'text/html' },
  IMAGE_JPEG: { 'Content-Type': 'image/jpeg' },
  IMAGE_PNG: { 'Content-Type': 'image/png' },
});

const MIME_TYPE = Object.freeze({
  TEXT_HTML: 'text/html',
  IMAGE_JPEG: 'image/jpeg',
  IMAGE_PNG: 'image/png',
});

const FILE_EXTENSIONS = Object.freeze({
  JPEG: '.jpeg',
  PNG: '.png',
});

const FILE_STAGE = Object.freeze({
  SPLIT_DOCUMENTS: 'Split Documents',
  AUTO_PROCESS: 'AUTO_PROCESS',
});

const METHOD_TYPE = Object.freeze({
  POST: 'POST',
  GET: 'GET',
});

const QUEUE_STATUS = Object.freeze({
  SUBMIT: 'submitted',
  COMPLETE: 'completed',
  FAILURE: 'failure',
  OPERATOR_QUEUE: 'inOperatorQueue',
  INPROGRESS_QUEUE: 'inProgress',
  INSYSTEM_QUEUE: 'inSystemQueue',
});

const FILE_STATUS = Object.freeze({
  PROCESSING: 'PROCESSING',
  UPLOADED: 'UPLOADED',
  INQUEUE: 'INQUEUE',
  PICKED: 'PICKED',
  PICKED_DONE: 'PICKED_DONE',
  STARTED: 'STARTED',
  SUCCESS: 'SUCCESS',
  COMPLETE: 'COMPLETE',
  FAILED: 'FAILED',
  RETRY: 'RETRYING',
  SUBMITTED: 'SUBMITTED',
  CASE_PROCESSING: 'CASE_PROCESSING',
  CASE_COMPLETE: 'CASE_COMPLETE',
  CASE_COMPLETED: 'CASE_COMPLETED',
  FILE_PROCESSING:'FILE_PROCESSING',
  FILE_UPLOADED: 'FILE_UPLOADED',
  FILE_MANUAL_INQUEUED:'FILE_MANUAL_INQUEUED',
  FILE_MANUAL_PICKED:'FILE_MANUAL_PICKED',
  FILE_MANUAL_DONE: 'FILE_MANUAL_DONE',
  FILE_COMPLETED:'FILE_COMPLETED',
  FILE_FAILED:'FILE_FAILED',
  COMPLETED: 'COMPLETED',
  
});

const PIPELINE_STATUS = {
  userId: '',
  userName: '',
  role: '',
  pickedOn: '',
  submittedOn: '',
  isComplete: '',
  processType: '',
};

const DATE_FORMAT = Object.freeze({
  DATE_FORMAT_YYYY_MM_DD: 'YYYY-MM-DD hh:mm:ss',
});

const SHARING_OPTION = Object.freeze({
  PUBLIC: 'public',
  PRIVATE: 'private',
  SHARE_WITH: 'share_with',
});

const MINIO_CONST = Object.freeze({
  PRESIGNED_URL_EXPIRE_TIME: 7 * 24 * 60 * 60,
  RESPONSE_CONTENT_TYPE: 'text/html',
});

const TASK_TYPE = Object.freeze({
  CLASSIFICATION: 'classification',
  EXTRACTION: 'extraction',
  CLASSIFICATION_EXTRACTION: 'classification-extraction',
  SUBMIT: 'submitted',
});

const NOTIFICATION_DEFAULT_DATA = {
  action: null,
  caseId: null,
  exception: null,
  fileId: null,
  finalStage: null,
  orgId: null,
  processId: null,
  processedAt: null,
  runtime: null,
  status: null,
  taskId: null,
  taskType: null,
  timestamp: null,
  traceback: null,
};

const FLUENT_LOGS_PAYLOAD = {
  event: '',
  timestamp: '',
  organization: '',
  user: '',
  role: '',
  details: {},
};

const FLUENT_EVENT_TYPE = Object.freeze({
  UPDATE_CASE_PRIORITY: 'UPDATE_CASE_PRIORITY',
  UPDATE_FILE_PRIORITY: 'UPDATE_FILE_PRIORITY',
  FILE_UPLOAD: 'FILE_UPLOAD',
  CASE_FILE_UPLOAD: 'CASE_FILE_UPLOAD',
  RESET_PASSWORD: 'RESET_PASSWORD',
  UPDATE_PASSWORD: 'UPDATE_PASSWORD',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  CREATE_CASE: 'CREATE_CASE',
  DELETE_CASE: 'DELETE_CASE',
  MINIO_UPLOAD: 'MINIO_UPLOAD',
  DELETE_FILE: 'DELETE_FILE',
  PROCESS_FILE: 'PROCESS_FILE',
  REPROCESS_FILE: 'REPROCESS_FILE',
  PICK_TASK_FROM_QUEUE: 'PICKED',
  SUBMIT_TASK_TO_QUEUE: 'PICKED_DONE',
  REQUEUE_TASK_TO_QUEUE: 'INQUEUE',
});

const DYNAMIC_TABLES = {
  CLASSIFIER_CONFIGS_OLD: 'classifier_configs_old',
  SUBCLASSIFIER_CONFIGS_OLD: 'classifier_sub_doc_configs_old',
  BOX_SIZE_CONFIGS: 'area_detector_box_size_configs',
  DEFAULT_DOC_FIELDS_OLD: 'ui_global_doc_fields_old',
  DOC_CATEGORIES_OLD: 'ui_doc_categories_old',
  DOC_FIELDS_OLD: 'ui_doc_fields_old',
  MISMO_CONFIGS: 'mismo_configs',
  EXTRACTOR_CONFIGS_OLD: 'extractor_configs_old',
  FILTER_TOKENS: 'area_detector_filter_tokens',
  TOKEN_CONFIGS: 'area_detector_token_configs',
};

const TABLE_VIEWS = {
  CASE_LIST: 'case_list',
  FILE_LIST: 'file_list',
};

const PASSWORD_EXPIRY = {
  TRIGGER_ALERT: 2,
  PASSWORD_EXPIRE_AFTER: 60,
  PASSWORD_EXPIRY_UNIT: 'days',
};

const LIMIT_OFFSET = Object.freeze({
  LIMIT: 10,
  OFFSET: 0,
});


const MODEL_NAME = Object.freeze({
  CASE: 'platform_cases',
  AREA_DETECTOR_BOX_SIZE_CONFIGS: 'area_detector_box_size_configs',
  CONFIG_SET: 'platform_config_sets',
  UI_GLOBAL_DOC_FIELDS_OLD: 'ui_global_doc_fields_old',
  UI_DOC_CATEGORIES_OLD: 'ui_doc_categories_old',
  UI_DOC_FIELDS_OLD: 'ui_doc_fields_old',
  CLASSIFIER_CONFIGS_OLD: 'classifier_configs_old',
  AREA_DETECTOR_FILTER_TOKENS: 'area_detector_filter_tokens',
  MISMO_CONFIGS: 'mismo_configs',
  ORGANIZATION: 'platform_organizations',
  PERMISSION: 'platform_permissions',
  PIPELINE_DEFINATION: 'platform_pipeline_definitions',
  PROCESSING_CLASSES: 'platform_processing_classes',
  P_R_OUTPUT: 'p_r_output',
  P_R_REGRESSION_GOLD_DATA: 'p_r_regression_gold_data',
  ROLES: 'platform_roles',
  ROLE_PERMISSIONS: 'platform_role_permissions',
  CLASSIFIER_SUB_DOC_CONFIGS_OLD: 'classifier_sub_doc_configs_old',
  AREA_DETECTOR_TOKEN_CONFIGS: 'area_detector_token_configs',
  FILES: 'platform_files',
  USERS: 'platform_users',
  USERS_SECURITIES: 'platform_users_securities',
  PIPELINE_STAGE_PARAMETER_CONFIGS:'pipeline_stage_parameter_configs',
  UI_SETTING_GROUP_CONFIGS:'ui_settings_group_configs'
});

const PIPELINE_PROCESS = Object.freeze({
  PICKED_ON: 'pickedOn',
  SUBMITTED_ON: 'submittedOn',
});

export {
  STATUS_OPTION,
  SHARING_OPTION,
  FILE_STAGE,
  TIME,
  FILE_STATUS,
  DATE_FORMAT,
  FILE_OPERATION,
  MINIO_CONST,
  HEADER_CONTENT_TYPE,
  MIME_TYPE,
  FILE_EXTENSIONS,
  TASK_TYPE,
  METHOD_TYPE,
  END_PATH,
  QUEUE_STATUS,
  ROLE_OPTION,
  OBJECT_OPTION,
  PERMISSION_OPTION,
  NOTIFICATION_DEFAULT_DATA,
  DYNAMIC_TABLES,
  TABLE_VIEWS,
  FLUENT_LOGS_PAYLOAD,
  PIPELINE_STATUS,
  PASSWORD_EXPIRY,
  FLUENT_EVENT_TYPE,
  LIMIT_OFFSET,
  MODEL_NAME,
  PIPELINE_PROCESS,
};
