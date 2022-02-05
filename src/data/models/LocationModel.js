import Sequelize from 'sequelize';
import db from '../sequelize_connection';

const LocationModel = db.define(
  'locations',
  {
    id: {
      type: Sequelize.INTEGER,
      field: 'id',
      primaryKey: true,
      autoIncrement: true,
    },
    keyy: {
      type: Sequelize.TEXT,
      field: 'keyy',
    },
    locName: {
      type: Sequelize.TEXT,
      field: 'loc_name',
    },
    locType: {
      type: Sequelize.TEXT,
      field: 'loc_type',
    },
    locSubType: {
      type: Sequelize.TEXT,
      field: 'loc_sub_type',
    },
    locDesc: {
      type: Sequelize.TEXT, 
      field: 'loc_desc',
    },
    locNameLong: {
      type: Sequelize.TEXT,
      field: 'loc_name_long',
    },
    locRefId: {
      type: Sequelize.TEXT,
      field: 'loc_ref_id', 
    },
    locRefIdType: {
      type: Sequelize.TEXT,
      field: 'loc_ref_id_type',
    },
    coordLonLat: {
      type: Sequelize.TEXT,
      field: 'coord_lon_lat',  //point
    },
    addrState: {
      type: Sequelize.TEXT,
      field: 'addr_state',
    },
    county: {
      type: Sequelize.TEXT,
      field: 'priority',
      field: 'addr_county',
    },
    notes: {
      type: Sequelize.TEXT,
      field: 'notes',
    },
    dqStatus: {
      type: Sequelize.TEXT,
      field: 'dq_status',
    },
    dataCleanseLevel: {
      type: Sequelize.INTEGER,
      field: 'data_cleanse_level',
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      field: 'is_active',
    },
    isDeleted: {
      type: Sequelize.BOOLEAN,
      field: 'is_deleted',
    },
    createdBy: {
      type: Sequelize.TEXT,
      field: 'created_by',
    },
    createdOn: {
      type: Sequelize.TEXT,
      field: 'created_on',
    },
    updatedBy: {
      type: Sequelize.TEXT,
      field: 'updated_by',
    },
    updatedOn: {
      type: Sequelize.TEXT,
      field: 'updated_on',
    },
   
  },
  {
    freezeTableName: false,
    timestamps: false,
  }
);

export default LocationModel;
