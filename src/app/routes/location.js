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
    return res.status(200).send(result);

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
    const payload = req.body;

    const locationData = await LocationModel.findByPk(locationId);
    if (locationData && locationData.dataValues) {
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
    // const perPage = req.query.perPage;
    // const offset = req.query.page;
  
    // const query = {};
  
    // query.limit = perPage ? perPage : 10;
    // query.offset = offset ? offset : 0;
    const whereCondition = [];

    // search location by location name
    if(req.query.search){
      const searchValue = req.query.search;
      const searchKey = 'locName';
      whereCondition.push({ [searchKey]: { [Op.iLike]: `%${searchValue}%` } });
    }

    const locationData = await LocationModel.findAll({
      where: {
        [Op.and]: whereCondition
      },
      raw: true
    });

    // send result to UI app
    return res.status(200).send({
      data: locationData
    })

  } catch (error) {
    logger.error(error)
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

    let location = await LocationModel.findByPk(locationId);

    if (location != null) {
      location.destroy({ force: true });
      // commit current DB operation on successful processing & send response to UI app
      await transaction.commit();
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
