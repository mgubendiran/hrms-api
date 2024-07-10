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
    PunchRecords: string,
    InTime: string,
    InDeviceId: string,
    OutTime: string,
    OutDeviceId: string,
    Duration: number,
    LateBy: number,
    EarlyBy: number,
    ShiftId: number
}

// Sequelize Model
export const AttendanceLog: sequelize.Model<AttendanceLogInterface, {}> = databaseInstance.define<AttendanceLogInterface, {}>("AttendanceLogs", {

// CREATE TABLE attendance.dbo.AttendanceLog (
// 	AttendanceLogID int NOT NULL,
// 	AttendanceDate datetime NULL,
// 	Present bit NULL,
// 	Absent bit NULL,
// 	Status varchar(100) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	StatusCode varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	PunchRecords text COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	InTime varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	InDeviceId varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	OutTime varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	OutDeviceId varchar(255) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	Duration float NULL,
// 	LateBy bigint NULL,
// 	EarlyBy bigint NULL,
// 	ShiftId bigint NULL,
// 	EmployeeNumber varchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL,
// 	EmployeeName varchar(200) COLLATE SQL_Latin1_General_CP1_CI_AS NULL
// );
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
    },
    PunchRecords: {
        type: sequelize.TEXT,
        allowNull: true
    },
    InTime: {
        type: sequelize.STRING,
        allowNull: true
    },
    InDeviceId: {
        type: sequelize.STRING,
        allowNull: true
    },
    OutTime: {
        type: sequelize.STRING,
        allowNull: true
    },
    OutDeviceId: {
        type: sequelize.STRING,
        allowNull: true
    },
    Duration: {
        type: sequelize.FLOAT,
        allowNull: true
    },
    LateBy: {
        type: sequelize.BIGINT,
        allowNull: true
    },
    EarlyBy: {
        type: sequelize.BIGINT,
        allowNull: true
    },
    ShiftId: {
        type: sequelize.BIGINT,
        allowNull: true
    }
}, {
        timestamps: false,
        tableName: 'AttendanceLog'
    });