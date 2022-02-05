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
    console.error(error)
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
    console.error(error)
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
    // logger.info('locationList is here----',process.env.POSTGRES_HOST);
    const locationData = await LocationModel.findByPk(locationId);

    // send result to UI app
    if (locationData && locationData.dataValues) {
      const data = locationData.dataValues
      return res.status(200).send(data)
    } else {
      return res.status(200).send({})
    }
  } catch (error) {
    console.error(error)
    // send error response if any error occurs
    return res.status(500).send({
      result: "Server Error"
    })
  }
};

export const locationList = async (req, res) => {
  const perPage = req.query.perPage;
  const offset = req.query.page;

  const query = {};

  query.limit = perPage ? perPage : 10;
	query.offset = offset ? offset : 0;
  try {
    // logger.info('locationList is here----',process.env.POSTGRES_HOST);
    const locationData = await LocationModel.findAll(query, {
      raw: true
    });

    // send result to UI app
    return res.status(200).send({
      data: locationData
    })

  } catch (error) {
    console.error(error)
    // send error response if any error occurs
    return res.status(500).send({
      result: "Server Error"
    })
  }
};

export const removeLocation = async (req, res) => {
  // create a temporary transaction for DB operation
  let transaction = await db.transaction()
  const locationId = req.params.locationId;
  try {
    let location = await LocationModel.findByPk(locationId);
    if (location != null) {
      location.destroy({ force: true });
      // commit current DB operation on successful processing & send response to UI app
      await transaction.commit();
      return res.status(200).send({ data: null });
    } else {
      // send response to UI app
      return res.status(200).send({ data: "Location Not Found" });
    }
  } catch (error) {
    console.error(error);
    // roll back current DB operation if any error occurs & send response to UI app
    await transaction.rollback();
    return res.status(500).send({
      result: "Server Error"
    })
  }
};
