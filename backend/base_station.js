const express = require('express');
const { sequelize } = require('./db');

const connections = new Set();

const setupWss = (wss) => {
    wss.on('connection', (ws) => {
        console.log('New WebSocket connection established');
        connections.add(ws);
        ws.on('message', (message) => {
            console.log('Received message:', message);
            // If message len is less than expected, ignore
            if (message.length < 28) {
                console.error('Invalid message length:', message.length);
                return;
            }
            // Handle incoming messages from base stations here
            // First is bool if this is calibration data request
            const isCalibrationRequest = message.readInt8(0) !== 0;
            // Next 4 bytes are device id as integer
            const deviceId = message.readInt32LE(4);
            // Next 4 bytes is fill level as integer
            const fillLevel = message.readInt32LE(8);
            // float temperature;
            const temperature = message.readFloatLE(12);
            // float humidity;
            const humidity = message.readFloatLE(16);
            // float pollution;
            const pollution = message.readFloatLE(20);
            // bool alarm;
            const alarm = message.readInt8(24) !== 0;
            console.log(`Parsed data - Device ID: ${deviceId}, Fill Level: ${fillLevel}, Temperature: ${temperature}, Humidity: ${humidity}, Pollution: ${pollution}, Alarm: ${alarm}`);
            if (isCalibrationRequest) {
                // Get bin and its type
                sequelize.models.Bin.findOne({
                    where: {
                        device_mac: deviceId.toString()
                    },
                    include: sequelize.models.BinType
                }).then((bin) => {
                    if (bin && bin.BinType) {
                        sendCalibrationData(deviceId, bin.BinType.empty_distance, bin.BinType.full_distance);
                    } else {
                        console.error('Bin or BinType not found for device:', deviceId.toString());
                    }
                }).catch((err) => {
                    console.error('Error fetching bin for calibration:', err);
                });
                return;
            }

            sequelize.models.Bin.update({
                fillLevel,
                temperature,
                humidity,
                pollution,
                alarm
            }, {
                where: {
                    device_mac: deviceId.toString()
                }
            }).then(() => {
                console.log(`Updated bin ${deviceId.toString()} with fillLevel ${fillLevel}`);
            }).catch((err) => {
                console.error('Error updating bin:', err);
            })
        });
        ws.on('close', () => {
            connections.delete(ws);
            console.log('WebSocket connection closed');
        });
    });
}

const sendCalibrationData = (deviceId, emptyDistance, fullDistance) => {
    const message = Buffer.alloc(12);
    message.writeInt32LE(deviceId, 0);
    message.writeFloatLE(emptyDistance, 4);
    message.writeFloatLE(fullDistance, 8);
    console.log(`Sending calibration data to device ${deviceId}: emptyDistance=${emptyDistance}, fullDistance=${fullDistance}`);
    connections.forEach((ws) => {
        ws.send(message);
    });
}

module.exports = setupWss;
