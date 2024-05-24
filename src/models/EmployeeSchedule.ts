import database from '../config/db';
import sequelize, { BOOLEAN } from 'sequelize';

// Database connection instance
let databaseInstance = new database().database;

// User Interface
export interface EmployeeScheduleInterface {
    EmployeeID: number;
	CurrentWorkLocation: string;
	Monday: string;
	Tuesday : string;
	Wednesday : string;
	Thursday: string;
	Friday: string;
	EffectiveDate: Date;
    Comments: string;
}

// Sequelize Model
export const EmployeeSchedule: sequelize.Model<EmployeeScheduleInterface, {}> = databaseInstance.define<EmployeeScheduleInterface, {}>("EmployeeSchedule", {
    
    EmployeeID: {
        type: sequelize.INTEGER,
        primaryKey: true

    },
    CurrentWorkLocation: {
        type: sequelize.STRING,
        allowNull: true
    },
    Monday: {
        type: sequelize.STRING,
        allowNull: true
    },
    Tuesday: {
        type: sequelize.STRING,
        allowNull: true
    },
    Wednesday: {
        type: sequelize.STRING,
        allowNull: true
    },
    Thursday: {
        type: sequelize.STRING,
        allowNull: true
    },
    Friday: {
        type: sequelize.STRING,
        allowNull: true
    },
    EffectiveDate: {
        type: sequelize.DATE,
        allowNull: true
    },
    Comments: {
        type: sequelize.STRING,
        allowNull: true
    }
}, {
        timestamps: false,
        tableName: 'EmployeeSchedule'
    });