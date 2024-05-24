import database from '../config/db';
import sequelize, { BOOLEAN } from 'sequelize';

// Database connection instance
let databaseInstance = new database().database;

// User Interface
export interface ProjectInterface {
    project_id: number;
	project_name: string;
	project_code: string;
	start_date_proj : Date;
    end_date_proj: Date;
	client_name: string;
}

// Sequelize Model
export const Project: sequelize.Model<ProjectInterface, {}> = databaseInstance.define<ProjectInterface, {}>("Project", {
    // [project_id] [int] NULL,
	// [project_name] [varchar](200) NULL,
	// [client_id] [int] NULL,
	// [comp_id_comp] [int] NULL,
	// [bu_id_bu] [int] NULL,
	// [project_code] [varchar](50) NULL,
	// [lead] [int] NULL,
	// [start_date_proj] [date] NULL,
	// [end_date_proj] [date] NULL,
	// [billable] [varchar](10) NULL,
	// [budget_hrs] [int] NULL,
	// [used_hrs] [int] NULL,
	// [log] [varchar](20) NULL,
	// [client_name] [varchar](200) NULL

    project_id: {
        type: sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    project_name: {
        type: sequelize.STRING,
        allowNull: true
    },
    project_code: {
        type: sequelize.STRING,
        allowNull: true
    },
    client_name: {
        type: sequelize.STRING,
        allowNull: true
    },
    start_date_proj: {
        type: sequelize.DATE,
        allowNull: true
    },
    end_date_proj: {
        type: sequelize.DATE,
        allowNull: true
    }
}, {
        timestamps: false,
        tableName: 'project_prod'
    });