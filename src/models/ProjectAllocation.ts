import database from '../config/db';
import sequelize, { BOOLEAN } from 'sequelize';

// Database connection instance
let databaseInstance = new database().database;

// User Interface
export interface ProjectAllocationInterface {
    ProjectAllocationID: number;
	ProjectID: number;
	EmployeeID: number;
	DateOfAllocationToProject : Date;
    ExpectedReleaseDate: Date;
	RequestId: number;
	Feedback: string;
    IsReleased: boolean;
}

// Sequelize Model
export const ProjectAllocation: sequelize.Model<ProjectAllocationInterface, {}> = databaseInstance.define<ProjectAllocationInterface, {}>("ProjectAllocations", {
    // [ProjectAllocationID] [int] IDENTITY(1,1) NOT NULL,
	// [ProjectID] [int] NOT NULL,
	// [EmployeeID] [int] NOT NULL,
	// [DateOfAllocationToProject] [datetime] NULL,
	// [ExpectedReleaseDate] [datetime] NULL,
	// [RequestId] [int] NULL,
	// [Feedback] [varchar](1000) NULL,
	// [IsReleased] [bit]

    ProjectAllocationID: {
        type: sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    ProjectID: {
        type: sequelize.INTEGER,
        allowNull: true
    },
    EmployeeID: {
        type: sequelize.INTEGER,
        allowNull: true
    },
    DateOfAllocationToProject: {
        type: sequelize.DATE,
        allowNull: true
    },
    ExpectedReleaseDate: {
        type: sequelize.DATE,
        allowNull: true
    },
    RequestId: {
        type: sequelize.INTEGER,
        allowNull: true
    },
    Feedback: {
        type: sequelize.STRING,
        allowNull: true
    },
    IsReleased: {
        type: sequelize.BOOLEAN,
        allowNull: true
    }
}, {
        timestamps: false,
        tableName: 'ProjectAllocation_Prod'
    });