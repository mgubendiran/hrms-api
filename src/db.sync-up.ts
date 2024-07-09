const sql = require("mssql");
const fs = require('fs');
const mssql = require('./pool');

// SQL Server configuration
var sourceDBConfig = {
  "user": "internalapp", // Database username
  "password": "App@1234", // Database password
  "server": "ENCDTD002-SRVR", // Server IP address
  "database": "etimetracklite1", // Database name
  "options": {
    "encrypt": false // Disable encryption
  }
}

var targetDBConfig = {
  "user": "rma_usr", // Database username
  "password": "rms2017#", // Database password
  "server": "192.168.1.151", // Server IP address
  "database": "Hrms", // Database name
  "options": {
    "encrypt": false // Disable encryption
  }
}

const getQuery = (perPage: number, page = 0, lastSyncIndex = 0) => {
  let offset = perPage * page;
  console.log("offset, perPage, page : ", offset, perPage, page)
  let query = `SELECT TOP ${perPage} * FROM (
      SELECT TOP ${perPage + offset} ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS ROW_NO,
  al.AttendanceLogId as AttendanceLogID,
  al.AttendanceDate,
  al.Present,
  al.Absent,
  al.Status,
  al.StatusCode,
  al.PunchRecords,
  al.InTime,
  al.InDeviceId,
  al.OutTime,
  al.OutDeviceId,
  al.Duration,
  al.LateBy,
  al.EarlyBy,
  al.ShiftId,
  e.EmployeeName,
  e.EmployeeCode
FROM AttendanceLogs al
INNER JOIN Employees e 
ON al.EmployeeId = e.EmployeeId 
AND al.AttendanceLogId > ${lastSyncIndex}
ORDER BY al.AttendanceLogId
) XX WHERE ROW_NO >${offset}`
  return query;

}

const syncRecords = async (recordset = []) => {
  const table = new sql.Table("attendance.dbo.AttendanceLogV1");
  table.create = true;
  table.columns.add("AttendanceLogID", sql.Int, { nullable: false });
  table.columns.add("AttendanceDate", sql.DateTime, { nullable: true });
  table.columns.add("Present", sql.Bit, { nullable: true });
  table.columns.add("Absent", sql.Bit, { nullable: true });
  table.columns.add("Status", sql.VarChar(100), { nullable: true });
  table.columns.add("StatusCode", sql.VarChar(255), { nullable: true });
  table.columns.add("PunchRecords", sql.Text, { nullable: true });
  table.columns.add("InTime", sql.VarChar(255), { nullable: true });
  table.columns.add("InDeviceId", sql.VarChar(255), { nullable: true });
  table.columns.add("OutTime", sql.VarChar(255), { nullable: true });
  table.columns.add("OutDeviceId", sql.VarChar(255), { nullable: true });
  table.columns.add("Duration", sql.Float, { nullable: true });
  table.columns.add("LateBy", sql.BigInt, { nullable: true });
  table.columns.add("EarlyBy", sql.BigInt, { nullable: true });
  table.columns.add("ShiftId", sql.BigInt, { nullable: true });
  table.columns.add("EmployeeNumber", sql.VarChar(200), { nullable: true });
  table.columns.add("EmployeeName", sql.VarChar(200), { nullable: true });
  recordset.forEach(rec => {
    const { AttendanceLogID,
      AttendanceDate,
      Present,
      Absent,
      Status,
      StatusCode,
      PunchRecords,
      InTime,
      InDeviceId,
      OutTime,
      OutDeviceId,
      Duration,
      LateBy,
      EarlyBy,
      ShiftId,
      EmployeeCode,
      EmployeeName } = rec;
    table.rows.add(AttendanceLogID,
      AttendanceDate,
      Present,
      Absent,
      Status,
      StatusCode,
      PunchRecords,
      InTime,
      InDeviceId,
      OutTime,
      OutDeviceId,
      Duration,
      LateBy,
      EarlyBy,
      ShiftId,
      EmployeeCode,
      EmployeeName)
  })

  let sqlPool = await mssql.GetCreateIfNotExistPool(targetDBConfig)
  let request = new sql.Request(sqlPool);
  let result = await request.bulk(table);
  let lastRecord: any = recordset?.[recordset?.length - 1]
  let lastSyncId = lastRecord?.AttendanceLogID;
  console.log('lastSyncId: ', lastSyncId)
  let fsRes = fs.writeFileSync('file_sync.txt', lastSyncId.toString(), "utf8") //  {encoding: 'utf8', flag: 'W'}
  return result;

}
const syncData = async () => {
  try {
    let content = fs.readFileSync('file_sync.txt');
    let index = parseInt(content.toString());
    console.log('last-sync-up-index: ', index);
    let sqlPool = await mssql.GetCreateIfNotExistPool(sourceDBConfig)
    let request = new sql.Request(sqlPool);
    // let sourceDBCountQuery = `SELECT COUNT(al.AttendanceLogId) as count FROM AttendanceLogs al LEFT JOIN Employees e ON al.EmployeeId = e.EmployeeId  AND al.AttendanceLogId > ${index} AND e.CompanyId = 3`
    
    let sourceDBCountQuery = `WITH 
      AttendanceLog as (
    SELECT * FROM AttendanceLogs WHERE AttendanceLogId > ${index}
    )
SELECT COUNT(*) as count
FROM AttendanceLog al
LEFT OUTER JOIN Employees e ON al.EmployeeId = e.EmployeeId `
    const result = await request.query(sourceDBCountQuery)
    let count = result.recordset?.[0]?.count;
    console.log('Total New Records:', count)

    let loop = Math.ceil(count / 10000);
    for (let i = 0; i < loop; i++) {
      const dataQuery = getQuery((i == loop - 1) ? count - (10000 * i) : 10000, i, index);
      let data = await request.query(dataQuery);
      try {
        let records = await syncRecords(data.recordset);
        console.log("updated - records: ", records)
      }
      catch (err) {
        console.error(err)
      }
    }
    return 'sync-up-done'

  } catch (err) {
    console.log(err)
  }
}

// syncData()
//   .then(res => {
//     console.log(res)
//   }).catch(e => {
//     console.log(e)
//   })

export = syncData;
