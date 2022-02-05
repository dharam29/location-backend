import express from 'express';
import {addLocation, updateLocation, locationDetail, locationList, removeLocation} from './location';

const router = express.Router();

const API = '/api/v1';

router
  .post(`${API}/location`, addLocation)

  .put(`${API}/location/:locationId`, updateLocation)

  .get(`${API}/location`, locationList)

  .get(`${API}/location/:locationId`, locationDetail)

  .delete(`${API}/location/:locationId`, removeLocation)

  .get(`${API}/health-check`, async (req, res) => {
    res.send('Location api server is healthy');
  });

export default router;
