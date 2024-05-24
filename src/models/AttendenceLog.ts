import database from '../config/db';
import sequelize, { BOOLEAN } from 'sequelize';

// Database connection instance
let databaseInstance = new database().database;

// User Interface
export interface AttendanceLogInterface {
    AttendanceLogID: number;
	EmployeeNumber: string;
	EmployeeName: string;
	AttendanceDate : Date;
	Present : boolean;
	Absent: boolean;
	Status: string;
	StatusCode: string;
    day: string;
}

// Sequelize Model
export const AttendanceLog: sequelize.Model<AttendanceLogInterface, {}> = databaseInstance.define<AttendanceLogInterface, {}>("AttendanceLogs", {
       
    AttendanceLogID: {
        type: sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    EmployeeNumber: {
        type: sequelize.STRING,
        allowNull: true
    },
    EmployeeName: {
        type: sequelize.STRING,
        allowNull: true
    },
    AttendanceDate: {
        type: sequelize.DATE,
        allowNull: true
    },
    Present: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    Absent: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    Status: {
        type: sequelize.STRING,
        allowNull: true
    },
    StatusCode: {
        type: sequelize.STRING,
        allowNull: true
    }
}, {
        timestamps: false,
        tableName: 'AttendanceLogs'
    });