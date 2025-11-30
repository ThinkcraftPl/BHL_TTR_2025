const path = require('path');
const { Sequelize } = require('sequelize');

const storagePath = process.env.SQLITE_STORAGE_PATH || path.join(__dirname, 'database.sqlite');
const logging = process.env.SQL_LOGGING === 'true' ? console.log : false;

const sequelize = new Sequelize({
	dialect: 'sqlite',
	storage: storagePath,
	logging,
});

const BinType = sequelize.define('BinType', {
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
    },
    empty_distance: {
        type: Sequelize.FLOAT,
        allowNull: false
    },
    full_distance: {
        type: Sequelize.FLOAT,
        allowNull: false
    }
});

// Create sequelize model
const Bin = sequelize.define('Bin', {
    location: {
        type: Sequelize.STRING,
        allowNull: false
    },
    fillLevel: {
        type: Sequelize.INTEGER,
        allowNull: false
    },
    temperature: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    alarm: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
    },
    humidity: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    pollution: {
        type: Sequelize.FLOAT,
        allowNull: true
    },
    lastEmptied: {
        type: Sequelize.DATE,
        allowNull: true
    },
    type: {
        type: Sequelize.STRING,
        allowNull: false
    },
    device_mac: {
        type: Sequelize.STRING
    },
    bin_type_id: {
        type: Sequelize.INTEGER,
        references: {
            model: BinType,
            key: 'id'
        }
    }
});

Bin.belongsTo(BinType, { foreignKey: 'bin_type_id' });

const initDatabase = async () => {
	try {
		await sequelize.authenticate();
        await sequelize.sync(); // Sync models to the database
		console.log(`SQLite database ready at ${storagePath}`);
	} catch (error) {
		console.error('Unable to connect to the database:', error);
		throw error;
	}
};

module.exports = {
	sequelize,
	initDatabase,
};
