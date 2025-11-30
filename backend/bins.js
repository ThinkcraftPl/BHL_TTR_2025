const express = require('express');
const router = express.Router();
const { Bin, sequelize } = require('./db');

router.get('/', async (req, res, next) => {
    try {
        const bins = await sequelize.models.Bin.findAll();
        // bins.forEach(bin => {
        //     const [lat, lon] = bin.location.split(',');
        //     if(lat > 1000 || lon > 1000) {
        //         bin.location = (lat / 10000).toFixed(6) + ',' + (lon / 10000).toFixed(6);
        //     }
        //     bin.save();
        // })
        res.json(bins);
    } catch (error) {
        next(error);
    }
});

router.post('/', async (req, res, next) => {
    try {
        const newBin = await sequelize.models.Bin.create(req.body);
        res.status(201).json(newBin);
    } catch (error) {
        next(error);
    }
});

module.exports = router;