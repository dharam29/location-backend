import sequelize from 'sequelize';
const { Op } = sequelize;

import { Logger } from '../../utils/logger';
import { LocationModel } from '../../data/models';
import db from '../../data/sequelize_connection';

const logger = Logger(module.filename);

export const addLocation = async (req, res) => {
  // create a temporary transaction for DB operation
  let transaction = await db.transaction();
  try {
    const payload = req.body;

    const result = await LocationModel.create(payload, { transaction });

    if (!result) {
      // roll back current DB operation if any error occurs & send response to UI app
      await transaction.rollback();
      return res.status(500).send({
        result: 'Server Error'
      });
    }

    // commit current DB operation on successful processing & send response to UI app
    await transaction.commit();
    return res.status(200).send({
      result: "Location Added Successfully"
    });
  } catch (error) {
    logger.error(error)
    await transaction.rollback();
    return res.status(500).send({
      result: "Server Error"
    })
  }
};

export const updateLocation = async (req, res) => {
  // create a temporary transaction for DB operation
  let transaction = await db.transaction();
  try {
    const locationId = req.params.locationId;
    let payload = req.body;
    payload.updatedOn = new Date().toISOString();

    const locationData = await LocationModel.findByPk(locationId, { raw: true });
    if (locationData) {
      const result = await LocationModel.update(payload, {
        where: {
          id: locationId,
        },
        returning: true
      });

      if (!result) {
        // roll back current DB operation if any error occurs & send response to UI app
        await transaction.rollback();
        return res.status(500).send({
          result: 'Server Error'
        });
      }

      // commit current DB operation on successful processing & send response to UI app
      await transaction.commit();
      return res.status(200).send(result);
    } else {
      return res.status(200).send({
        data: "Location Not Found"
      })
    }
  } catch (error) {
    logger.error(error)
    // roll back current DB operation if any error occurs & send response to UI app
    await transaction.rollback();
    return res.status(500).send({
      result: "Server Error"
    })
  }
};

export const locationDetail = async (req, res) => {
  try {
    const locationId = req.params.locationId
    let response;

    let locationData = await LocationModel.findByPk(locationId, { raw: true });

    // set empty object when no data exist for locationId
    if (!locationData) {
      response = { data: {} };
    }
    else{
      response = { data: locationData };
    }
    return res.status(200).send(response)
  } catch (error) {
    logger.error(error)
    // send error response if any error occurs
    return res.status(500).send({
      result: "Server Error"
    })
  }
};

export const locationList = async (req, res) => {
  try {
    const limit = req.query.limit || 5;
    let offset = 0;

    if (req.query.offset && req.query.offset !== 'undefined') {
      offset = req.query.offset;
    }

    const whereCondition = [];

    // search location by location name
    if(req.query.search){
      const searchValue = req.query.search;
      const searchKey = 'locName';
      whereCondition.push({ [searchKey]: { [Op.iLike]: `%${searchValue}%` } });
    }

    const locationData = await LocationModel.findAndCountAll({
      where: {
        [Op.and]: whereCondition
      },
      limit,
      offset,
      raw: true,
      logging: false
    });

    // send result to UI app
    return res.status(200).send({
      count: locationData.count,
      data: locationData.rows
    })

  } catch (error) {
    logger.error(JSON.stringify(error))
    // send error response if any error occurs
    return res.status(500).send({
      result: "Server Error"
    })
  }
};

export const removeLocation = async (req, res) => {
  // create a temporary transaction for DB operation
  let transaction = await db.transaction()
  try {
    const locationId = req.params.locationId;
    let response;

    let location = await LocationModel.findByPk(locationId, { raw: true });

    if (location != null) {
      const result = await LocationModel.update({isDeleted: true}, {
        where: {
          id: locationId,
        },
        returning: true
      });

      // commit current DB operation on successful processing & send response to UI app
      await transaction.commit();
      location['isDeleted'] = true;
      response = { data: location };
    } else {
      // send response to UI app
      response = { data: {} };
    }
    return res.status(200).send(response);
  } catch (error) {
    logger.error(error);
    // roll back current DB operation if any error occurs & send response to UI app
    await transaction.rollback();
    return res.status(500).send({
      result: "Server Error"
    })
  }
};
