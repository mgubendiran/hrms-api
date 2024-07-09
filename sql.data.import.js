const sql = require("mssql");
const fs = require('fs');
const { resolve } = require("path");
const mssql = require('./pool');
const e = require("express");
const { sign } = require("crypto");
const { table } = require("console");

// SQL Server configuration
var sourceDBConfig = {
  "user": "rma_usr", // Database username
  "password": "rms2017#", // Database password
  "server": "192.168.1.151", // Server IP address
  "database": "Hrms", // Database name
  "options": {
    "encrypt": false // Disable encryption
  }
}

var targetDBConfig = {
  "user": "rma_usr", // Database username
  "password": "rms2017#", // Database password
  "server": "192.168.1.151", // Server IP address
  "database": "attendance", // Database name
  "options": {
    "encrypt": false // Disable encryption
  }
}

const DATA_TYPE = {
  bit: function (size) { return sql.Bit },
  char: function (size) { return sql.Char(size) },
  date: function (size) { return sql.Date },
  datetime: function (size) { return sql.DateTime },
  int: function (size) { return sql.Int },
  nvarchar: function (size) { return sql.NVarChar(size) },
  tinyint: function (size) { return sql.TinyInt },
  varchar: function (size) { return sql.VarChar(sql.MAX) },
}

const getDataType = (type, size) => {
  switch (type) {
    case 'bit': return sql.Bit; break;
    case 'char': return sql.Char(size); break;
    case 'date': return sql.Date; break;
    case 'datetime': return sql.DateTime; break;
    case 'int': return sql.Int; break;
    case 'nvarchar':
      return sql.NVarChar(size); break;
    case 'tinyint': return sql.TinyInt; break;
    case 'varchar': return sql.VarChar(sql.MAX); break;
    default: return sql.NVarChar(50);
  }

}

// const dataTypeMapper = (dataType, size) => {
//   if(['bit', 'date', 'datetime', 'int', 'tinyint']) {
//     return DATA_TYPE[dataType]()
//   }
// }

const getTableSchema = (tableName) => {
  return `select TABLE_CATALOG, TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, IS_NULLABLE, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME='${tableName}'`;
}
const getTableData = (tableName) => {
  return `select * from ${tableName}`
}

const tableDataImport = async (tableName, schemaSet = {}, dataset = []) => {
  const table = new sql.Table(targetDBConfig.database + '.dbo.' + tableName);
  table.create = true;
  let columns = Object.keys(schemaSet);
  console.log('columns: ', columns)
  columns.forEach(col => {
    let { dataType, size, options } = schemaSet[col];
    table.columns.add(col, getDataType(dataType, size), options)
  })
  // table.columns.add('EmployeeId', sql.Int, { nullable: false });
  // table.columns.add('UserName', sql.NVarChar(256), { nullable: false });
  // table.columns.add('Number', sql.NVarChar(25), { nullable: false });
  // table.columns.add('FirstName', sql.NVarChar(50), { nullable: false });
  // table.columns.add('LastName', sql.NVarChar(50), { nullable: false });
  // table.columns.add('Gender', sql.Char(1), { nullable: false });
  // table.columns.add('ManagerId', sql.Int, { nullable: true });
  // table.columns.add('WorkLocation', sql.NVarChar(50), { nullable: true });
  // table.columns.add('EmploymentTypeId', sql.TinyInt, { nullable: true });
  // table.columns.add('IsActive', sql.Bit, { nullable: true });
  // table.columns.add('IsSeparation', sql.Bit, { nullable: true });
  // table.columns.add('SeparationDate', sql.Date, { nullable: true });
  // table.columns.add('IsTempDeactivation', sql.Bit, { nullable: true });

  dataset.forEach((row, i) => {
    let rowData = []
    columns.forEach(col => {
      rowData.push(row[col])
    })
    table.rows.add(...rowData);
  })

  let sqlPool = await mssql.GetCreateIfNotExistPool(targetDBConfig)
  let request = new sql.Request(sqlPool);
  let result = await request.bulk(table);
  return result;
}

const getData = async () => {
  try {

    let sqlPool = await mssql.GetCreateIfNotExistPool(sourceDBConfig)
    let request = new sql.Request(sqlPool);
    // const tables = ['Employee_Prod', 'project_prod', 'ProjectAllocation_Prod', 'EmployeeSchedule']
    const tables = ['EmployeeSchedule']
    for (let tableName of tables) {
      // let tableName = 'Employee_Prod'
      const result = await request.query(getTableSchema(tableName))
      let schemaSet = {}
      result.recordset?.forEach(obj => {
        schemaSet[obj.COLUMN_NAME] = {
          // COLUMN_NAME, IS_NULLABLE, DATA_TYPE, CHARACTER_MAXIMUM_LENGT
          dataType: obj.DATA_TYPE,
          size: obj.CHARACTER_MAXIMUM_LENGTH,
          options: {
            nullable: !!(obj.IS_NULLABLE == 'YES')
          }
        }
      });
      const data = await request.query(getTableData(sourceDBConfig.database + '.dbo.' +tableName))
      let response = await tableDataImport(tableName, schemaSet, data?.recordset)
      console.log("End Result:  ", tableName, response);
    }

  } catch (err) {
    console.log(err)

  }
}

getData()
  .then(res => {
    console.log(res)
  }).catch(e => {
    console.log(e)
  })
