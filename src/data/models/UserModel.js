import { Sequelize, DataTypes } from 'sequelize';
import db from '../sequelize_connection';
import { MODEL_NAME } from '../../utils/constant';

const UserModel = db.define(
  MODEL_NAME.USERS,
  {
    id: {
      type: Sequelize.INTEGER,
      field: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: Sequelize.TEXT,
      field: 'user_name',
    },
    email: {
      type: Sequelize.TEXT,
      field: 'email',
      allowNull: false,
      unique: true,
    },
    password: {
      type: Sequelize.JSONB,
      field: 'password',
    },
    passwordUpdatedOn: {
      type: DataTypes.DATEONLY,
      field: 'password_updated_at',
    },
    phone: {
      type: Sequelize.TEXT,
      field: 'phone',
    },
    orgId: {
      type: Sequelize.INTEGER,
      field: 'org_id',
      references: { model: 'organizations', key: 'id' },
    },
    profile: {
      type: Sequelize.TEXT,
      field: 'profile',
    },
    isDeleted: {
      type: Sequelize.BOOLEAN,
      field: 'is_deleted',
    },
    enabled: {
      type: Sequelize.BOOLEAN,
      field: 'enabled',
    },
    roleId: {
      type: Sequelize.INTEGER,
      field: 'role',
      references: { model: 'roles', key: 'id' },
    },
    isApiUser: {
      type: Sequelize.BOOLEAN,
      field: 'is_api_user',
      defaultValue: false,
    },
    apikey: {
      type: Sequelize.TEXT,
      field: 'api_key',
      unique: true,
    },
    createdAt: {
      type: 'DATE',
      field: 'created_at',
    },
    updatedAt: {
      type: 'DATE',
      field: 'updated_at',
    },
    createdBy: {
      type: Sequelize.INTEGER,
      field: 'created_by',
    },
    updatedBy: {
      type: Sequelize.INTEGER,
      field: 'updated_by',
    },
    token: {
      type: Sequelize.TEXT,
      field: 'token',
    },
    isTwoFactorAuthenticationRequired: {
      type: Sequelize.BOOLEAN,
      field: 'is_two_factor_authentication_required',
      defaultValue: false,
    },
    dob: {
      type: 'DATE',
      field: 'dob',
    },
    ssn: {
      type: Sequelize.INTEGER,
      field: 'ssn',
    },
  },
  {
    freezeTableName: false,
    timestamps: false,
  }
);

export default UserModel;
