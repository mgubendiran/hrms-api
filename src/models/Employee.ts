import database from '../config/db';
import sequelize, { BOOLEAN } from 'sequelize';
import { EmployeeScheduleInterface } from './EmployeeSchedule';
import { ProjectAllocationInterface } from './ProjectAllocation';
import { AttendanceLogInterface } from './AttendenceLog';
import { ProjectInterface } from './Project';

// Database connection instance
let databaseInstance = new database().database;

// User Interface
export interface EmployeeInterface {
    EmployeeId: string;
	UserName: string;
	Number: string;
	FirstName : string;
	LastName : string;
	Gender: string;
	ManagerId: number;
	WorkLocation: string;
	EmploymentTypeId: number;
	IsActive: boolean;
	IsSeparation: boolean;
	SeparationDate: Date;
	IsTempDeactivation: boolean;
    schedule: EmployeeScheduleInterface;
    project: ProjectInterface
    attendance_logs: AttendanceLogInterface[]
}

// Sequelize Model
export const Employee: sequelize.Model<EmployeeInterface, {}> = databaseInstance.define<EmployeeInterface, {}>("Employee_Prod", {
    // EmployeeId] [int] IDENTITY(1,1) NOT NULL,
	// UserName] [nvarchar](256) NOT NULL,
	// Number] [nvarchar](25) NULL,
	// FirstName] [nvarchar](50) NOT NULL,
	// LastName] [nvarchar](50) NOT NULL,
	// Gender] [char](1) NOT NULL,
	// ManagerId] [int] NULL,
	// WorkLocation] [nvarchar](50) NULL,
	// EmploymentTypeId] [tinyint] NOT NULL,
	// IsActive] [bit] NULL,
	// IsSeparation] [bit] NULL,
	// SeparationDate] [date] NULL,
	// IsTempDeactivation] [bit] NULL,
    EmployeeId: {
        type: sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    UserName: {
        type: sequelize.STRING,
        allowNull: true
    },
    Number: {
        type: sequelize.STRING,
        allowNull: true
    },
    FirstName: {
        type: sequelize.STRING,
        allowNull: true
    },
    LastName: {
        type: sequelize.STRING,
        allowNull: true
    },
    ManagerId: {
        type: sequelize.INTEGER,
        allowNull: true
    },
    WorkLocation: {
        type: sequelize.STRING,
        allowNull: true
    },
    EmploymentTypeId: {
        type: sequelize.INTEGER,
        allowNull: true
    },
    IsActive: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    IsSeparation: {
        type: sequelize.BOOLEAN,
        allowNull: true
    },
    SeparationDate: {
        type: sequelize.DATE,
        allowNull: true
    },
    IsTempDeactivation: {
        type: sequelize.BOOLEAN,
        allowNull: true
    }
}, {
        timestamps: false,
        tableName: 'Employee_Prod'
    });