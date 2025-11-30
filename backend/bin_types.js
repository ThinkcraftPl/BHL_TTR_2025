const express = require('express');
const router = express.Router();
const { BinType, sequelize } = require('./db');

router.get('/', async (req, res, next) => {
    try {
        const binTypes = await sequelize.models.BinType.findAll();
        res.json(binTypes);
    } catch (error) {
        next(error);
    }
});

module.exports = router;