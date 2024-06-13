import { Request, Response } from 'express';
import { AttendanceLog, AttendanceLogInterface } from '../models/AttendenceLog';
import { paginate, paginationMapper } from '../helper/paginate';
import { Op, where, fn, col } from 'sequelize';
import { CommonController } from '../helper/common';
import { EmployeeInterface } from '../models/Employee';
import { generateXLS } from '../helper/ExcelGenerator';
import { Project } from '../models/Project';
const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
import fs from 'fs';


const monthList: any = {
    1: "January",
    2: "February",
    3: "March",
    4: "April",
    5: "May",
    6: "June",
    7: "July",
    8: "Augest",
    9: "September",
    10: "October",
    11: "November",
    12: "December"
};

const width = 400; //px
const height = 400; //px
const backgroundColour = 'white'; // Uses https://www.w3schools.com/tags/canvas_fillstyle.asp
const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height, backgroundColour });
// const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: "300px", height: "300px", backgroundColour: "white" });

async function getImageData(configuration: any) {
    const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
    const base64Image = dataUrl

    var base64Data = base64Image.replace(/^data:image\/png;base64,/, "");
    fs.writeFile("out.png", base64Data, 'base64', function (err) {
        if (err) {
            console.log(err);
        }
    });
    return base64Data;
}
const commonController = new CommonController()

export class AttendanceLogController {

    constructor() { }

    readAll(req: Request, res: Response) {
        AttendanceLog.findAll({})
            .then((users: AttendanceLogInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    read(req: Request, res: Response) {
        AttendanceLog.findById(req.params.id)
            .then((user: AttendanceLogInterface | null) => {
                if (user) {
                    res.json(user);
                } else {
                    res.status(204).send();
                }
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    search(req: Request, res: Response) {
        let filter = req.body || {};
        let params = req.query || {};
        let searchFilter = paginate(filter, params)
        AttendanceLog.findAndCountAll(searchFilter)
            .then((employees: any) => {
                res.json(paginationMapper({ ...employees, ...params }));
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    getAttendanceLogsByEmployee(req: Request, res: Response) {
        let id = req.params.empId;
        AttendanceLog.findAll({
            where: {
                EmployeeNumber: id
            }

        })
            .then((users: AttendanceLogInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    getAttendanceLogsByEmployeeByMonth(req: Request, res: Response) {
        let id = req.params.empId;
        let month = parseInt(req.params.month);
        let year = parseInt(req.params.year);
        AttendanceLog.findAll({
            // attributes: [[ fn('MONTH', col('AttendanceDate')), 'data']],
            where: {
                EmployeeNumber: id,
                // AttendanceDate: { [Op.between]: ['2024-04-01', '2024-4-30']},
                AttendanceDate: {
                    [Op.and]: [
                        where(fn('MONTH', col('AttendanceDate')), month),
                        where(fn('YEAR', col('AttendanceDate')), year),
                        // where(fn('WEEK', col('AttendanceDate')), 1)
                    ]
                }
            }

        })
            .then((users: AttendanceLogInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    async getAttendanceLogsByProjectByMonth(req: Request, res: Response) {
        try {
            let id = parseInt(req.params.projectId);
            let month = parseInt(req.params.month);
            let year = parseInt(req.params.year);
            let empIds = await commonController.getEmployeesByProject(id);
            let employeeSchedule = await commonController.getEmployeesScheduleByIds(empIds.map(obj => obj.EmployeeID))
            let employees: any = await commonController.getEmployeesByIds(empIds.map(obj => obj.EmployeeID));
            console.log(employees)
            let attendanceLogs = await AttendanceLog.findAll({
                // attributes: [[ fn('MONTH', col('AttendanceDate')), 'data']],
                where: {
                    EmployeeNumber: { in: employees.map((obj: any) => obj.Number) },
                    // AttendanceDate: { [Op.between]: ['2024-04-01', '2024-4-30']},
                    AttendanceDate: {
                        [Op.and]: [
                            where(fn('MONTH', col('AttendanceDate')), month),
                            where(fn('YEAR', col('AttendanceDate')), year),
                            // where(fn('WEEK', col('AttendanceDate')), 1)
                        ]
                    }
                }
            })
            let result = employees.map((emp: any) => {
                let logs: any = attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number);
                logs = logs.map((obj: any) => {
                    return { ...obj.dataValues, day: commonController.getDay(obj.dataValues.AttendanceDate) }
                })
                let schedule: any = employeeSchedule.find(schedule => schedule.EmployeeID == emp.dataValues.EmployeeId)
                let present = 0;
                let absent = 0;
                let half = 0;
                let wo = 0;
                let others = 0;
                let complience = {
                    present: 0,
                    count: 0
                }
                logs.forEach((element: any) => {
                    let isComplience = schedule ? schedule[element.day] == '1' ? true : false : false;
                    isComplience ? ++complience.count : null;
                    switch (element.StatusCode) {
                        case 'P': ++present; isComplience ? ++complience.present : null; break;
                        case 'A': ++absent; break;
                        case '½P': ++half; isComplience ? ++complience.present : null; break;
                        case 'WO': ++wo; break;
                        default: ++others; break;
                    }
                });
                return {
                    ...emp.dataValues,
                    present,
                    absent,
                    half,
                    logs,
                    wo,
                    others,
                    complience,
                    // attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number), //.map(obj => { return {...obj, day: new Date(obj.AttendanceDate)}}),
                    schedule
                }
            })
            res.json(result)

        }
        catch (err) {
            res.json(err);
        }
        // .then((users: AttendanceLogInterface[]) => {
        //     res.json(users);
        // })
        // .catch((err: any) => {
        //     res.json(err);
        // });
    }

    async getAttendanceLogsByClientByMonth(req: Request, res: Response) {
        try {
            let client = req.params.client_name;
            let month = parseInt(req.params.month);
            let year = parseInt(req.params.year);
            // let empIds = await commonController.getEmployeesByProject(id);

            let projects = await commonController.getProjectByclient(client);
            if(!projects) {
                throw new Error('client not found')
            }
            // result.project = projects;

           let empIds = await commonController.getEmployeesByProjects(projects.map(p => p.project_id));
           

            let employeeSchedule = await commonController.getEmployeesScheduleByIds(empIds.map(obj => obj.EmployeeID))
            let employees: any = await commonController.getEmployeesByIds(empIds.map(obj => obj.EmployeeID));
            // console.log(employees)
            let attendanceLogs = await AttendanceLog.findAll({
                // attributes: [[ fn('MONTH', col('AttendanceDate')), 'data']],
                where: {
                    EmployeeNumber: { in: employees.map((obj: any) => obj.Number) },
                    // AttendanceDate: { [Op.between]: ['2024-04-01', '2024-4-30']},
                    AttendanceDate: {
                        [Op.and]: [
                            where(fn('MONTH', col('AttendanceDate')), month),
                            where(fn('YEAR', col('AttendanceDate')), year),
                            // where(fn('WEEK', col('AttendanceDate')), 1)
                        ]
                    }
                }
            })
            let result = employees.map((emp: any) => {
                let logs: any = attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number);
                logs = logs.map((obj: any) => {
                    return { ...obj.dataValues, day: commonController.getDay(obj.dataValues.AttendanceDate) }
                })
                let schedule: any = employeeSchedule.find(schedule => schedule.EmployeeID == emp.dataValues.EmployeeId)
                let present = 0;
                let absent = 0;
                let half = 0;
                let wo = 0;
                let others = 0;
                let count = 0;
                let complience = {
                    present: 0,
                    count: 0,
                    half: 0
                }
                logs.forEach((element: any) => {
                    let isComplience = schedule ? schedule[element.day] == '1' ? true : false : false;
                    isComplience ? ++complience.count : null;
                    switch (element.StatusCode) {
                        case 'P': ++present; count++; isComplience ? ++complience.present : null; break;
                        case 'A': ++absent; count++; break;
                        case '½P': ++half; count++; isComplience ? ++complience.half : null; break;
                        case 'WO': ++wo; break;
                        default: ++others; break;
                    }
                });
                let project: any = {};
                let projectAlloc = empIds.find(e => e.EmployeeID == emp.EmployeeId);
                if(projectAlloc) {
                    project = projects.find(p => p.project_id == projectAlloc.ProjectID);
                }

                return {
                    ...emp.dataValues,
                    present,
                    absent,
                    half,
                    count,
                    logs,
                    wo,
                    others,
                    complience,
                    // attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number), //.map(obj => { return {...obj, day: new Date(obj.AttendanceDate)}}),
                    schedule,
                    project
                }
            })
            res.json(result)

        }
        catch (err) {
            res.json(err);
        }
        // .then((users: AttendanceLogInterface[]) => {
        //     res.json(users);
        // })
        // .catch((err: any) => {
        //     res.json(err);
        // });
    }
    async downloadFile(req: Request, res: Response) {
        try {
            
            let id = parseInt(req.params.projectId);
            let month = parseInt(req.params.month);
            let year = parseInt(req.params.year);
            let project = await commonController.getProjectById(id);
            let empIds = await commonController.getEmployeesByProject(id);
            let employeeSchedule = await commonController.getEmployeesScheduleByIds(empIds.map(obj => obj.EmployeeID))
            let employees: any = await commonController.getEmployeesByIds(empIds.map(obj => obj.EmployeeID));
            // console.log("tempData: ", empIds)
            let managers: any = await commonController.getEmployeesByIds(employees.map(obj => obj.ManagerId));
            console.log("managers", managers)

            let attendanceLogs = await AttendanceLog.findAll({
                // attributes: [[ fn('MONTH', col('AttendanceDate')), 'data']],
                where: {
                    EmployeeNumber: { in: employees.map((obj: any) => obj.Number) },
                    // AttendanceDate: { [Op.between]: ['2024-04-01', '2024-4-30']},
                    AttendanceDate: {
                        [Op.and]: [
                            where(fn('MONTH', col('AttendanceDate')), month),
                            where(fn('YEAR', col('AttendanceDate')), year),
                            // where(fn('WEEK', col('AttendanceDate')), 1)
                        ]
                    }
                }
            })
            let result = employees.map((emp: any) => {
                let logs: any = attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number);
                logs = logs.map((obj: any) => {
                    return { ...obj.dataValues, day: commonController.getDay(obj.dataValues.AttendanceDate) }
                })
                let schedule: any = employeeSchedule.find(schedule => schedule.EmployeeID == emp.dataValues.EmployeeId)
                let present = 0;
                let absent = 0;
                let half = 0;
                let wo = 0;
                let others = 0;
                let complience = {
                    present: 0,
                    count: 0
                }
                logs.forEach((element: any) => {
                    let isComplience = schedule ? schedule[element.day] == '1' ? true : false : false;
                    isComplience ? ++complience.count : null;
                    switch (element.StatusCode) {
                        case 'P': ++present; isComplience ? ++complience.present : null; break;
                        case 'A': ++absent; break;
                        case '½P': ++half; isComplience ? ++complience.present : null; break;
                        case 'WO': ++wo; break;
                        default: ++others; break;
                    }
                });
                return {
                    ...emp.dataValues,
                    present,
                    absent,
                    half,
                    logs,
                    wo,
                    others,
                    complience,
                    // attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number), //.map(obj => { return {...obj, day: new Date(obj.AttendanceDate)}}),
                    schedule
                }
            })
            
            const getCommitedDays = (schedule: any) => {
                let DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                return DAYS.filter(day => schedule?.[day] == '1');
            }
            let cp = 0, ca = 0, ap = 0, aa = 0, ch=0, ah= 0;
            let data = result.map((d: any) => {
                let present = 0, complience = 0, attendance = 0;
                let commitedDays = getCommitedDays(d?.schedule || {})
                if(commitedDays.length > 0) {
                    present = d?.present + (d?.half/2);
                    attendance = present * 100 / (d.present + d.half + d.absent);
                    complience = (d?.complience?.present / d?.complience?.count ) * 100
                    cp +=  d?.complience?.present || 0
                    ca += d?.complience?.absent || 0
                    ch = d?.complience?.absent || 0
                    ap += d.present;
                    aa += d.absent
                    ah = d.half
                }
                // console.log("CP-AP: ", cp, ap)
                // let manager = commonController.getEmployeById(parseInt(d?.ManagerId));
                let manager = managers?.find((mg: any) => mg?.dataValues?.EmployeeId == d?.ManagerId);               
                return  {
                    EmpId: d.EmployeeId,
                    EmpNumber: d.Number,
                    Username: d.UserName,
                    Name: `${d.FirstName} ${d.LastName}`,
                    Project: project?.project_name,
                    Manager:`${manager?.FirstName || ""} ${manager?.LastName || ""}`,
                    "Work Mode": commitedDays.length > 0 ? "Office" : "Remote",
                    "Work Location" : d.WorkLocation,
                    "Commited Days": commitedDays.join(', '),
                    Present: present,
                    Absent: d.absent + (d.half / 2),
                    Compliance: Math.round(complience),
                    Attendance: Math.round(attendance)
                }
            })
            console.log("CP-AP final: : ", cp, ca, ap, aa, ch, ah )
            if (data.length > 0) {
                const config1 = {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'Present ' + Math.round((cp / (cp + ca)) * 100)  + '%',
                            'Absent ' + Math.round((ca / (cp + ca)) * 100)  + '%',
                          ],
                          datasets: [{
                            label: 'Compliance',
                            data: [
                                Math.round((cp / (cp + ca)) * 100),
                                Math.round((ca / (cp + ca)) * 100)
                            ],
                            backgroundColor: [
                              'green',
                              'red'
                            //   'rgb(54, 162, 235)'
                            ],
                            hoverOffset: 4
                          }]
                    },
                  };

                const config2 = {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'Present ' + Math.round((ap / (ap + aa)) * 100) + '%',
                            'Absent ' + Math.round((aa / (ap + aa)) * 100)  + '%',
                          ],
                          datasets: [{
                            label: 'Attendance',
                            data: [
                                Math.round((ap / (ap + aa)) * 100),
                                Math.round((aa / (ap + aa)) * 100)
                            ],
                            backgroundColor: [
                              'green',
                              'red'
                            //   'rgb(54, 162, 235)'
                            ],
                            hoverOffset: 4
                          }]
                    },
                  };
                let imageData = await getImageData(config1);
                let imageData2 = await getImageData(config2);
                const xlsBuffer = await generateXLS(data, imageData, imageData2, `${project?.project_code || ''} ${project?.project_name || ''}`, Math.round((cp / (cp + ca)) * 100), Math.round((ap / (ap + aa)) * 100), );
                res.set("Content-Disposition", `attachment; filename=report_${id}_${monthList[month]}.xls`);
                res.type("application/vnd.ms-excel");
                res.send(xlsBuffer);
            }
        } catch (err) {
            console.log(err)
            res.json("Something went wrong");
        }
    }

    async downloadMonthlyReport(req: Request, res: Response) {
        try {
            let client = req.params.client;
            let month = parseInt(req.params.month);
            let year = parseInt(req.params.year);
            // let empIds = await commonController.getEmployeesByProject(id);

            let projects = await commonController.getProjectByclient(client);
            if(!projects) {
                throw new Error('client not found')
            }
            // result.project = projects;

           let empIds = await commonController.getEmployeesByProjects(projects.map(p => p.project_id));
           

            let employeeSchedule = await commonController.getEmployeesScheduleByIds(empIds.map(obj => obj.EmployeeID))
            let employees: any = await commonController.getEmployeesByIds(empIds.map(obj => obj.EmployeeID));
            // console.log(employees)
            let managers: any = await commonController.getEmployeesByIds(employees.map((obj: any) => obj.ManagerId));

            let attendanceLogs = await AttendanceLog.findAll({
                // attributes: [[ fn('MONTH', col('AttendanceDate')), 'data']],
                where: {
                    EmployeeNumber: { in: employees.map((obj: any) => obj.Number) },
                    // AttendanceDate: { [Op.between]: ['2024-04-01', '2024-4-30']},
                    AttendanceDate: {
                        [Op.and]: [
                            where(fn('MONTH', col('AttendanceDate')), month),
                            where(fn('YEAR', col('AttendanceDate')), year),
                            // where(fn('WEEK', col('AttendanceDate')), 1)
                        ]
                    }
                }
            })
            let result = employees.map((emp: any) => {
                let logs: any = attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number);
                logs = logs.map((obj: any) => {
                    return { ...obj.dataValues, day: commonController.getDay(obj.dataValues.AttendanceDate) }
                })
                let schedule: any = employeeSchedule.find(schedule => schedule.EmployeeID == emp.dataValues.EmployeeId)
                let present = 0;
                let absent = 0;
                let half = 0;
                let wo = 0;
                let others = 0;
                let count = 0;
                let complience = {
                    present: 0,
                    count: 0,
                    half: 0
                }
                logs.forEach((element: any) => {
                    let isComplience = schedule ? schedule[element.day] == '1' ? true : false : false;
                    isComplience ? ++complience.count : null;
                    switch (element.StatusCode) {
                        case 'P': ++present; count++; isComplience ? ++complience.present : null; break;
                        case 'A': ++absent; count++; break;
                        case '½P': ++half; count++; isComplience ? ++complience.half : null; break;
                        case 'WO': ++wo; break;
                        default: ++others; break;
                    }
                });
                let project: any = {};
                let projectAlloc = empIds.find(e => e.EmployeeID == emp.EmployeeId);
                if(projectAlloc) {
                    project = projects.find(p => p.project_id == projectAlloc.ProjectID);
                }

                return {
                    ...emp.dataValues,
                    present,
                    absent,
                    half,
                    count,
                    logs,
                    wo,
                    others,
                    complience,
                    // attendanceLogs.filter(log => log.EmployeeNumber == emp.dataValues.Number), //.map(obj => { return {...obj, day: new Date(obj.AttendanceDate)}}),
                    schedule,
                    project
                }
            })
            const getCommitedDays = (schedule: any) => {
                let DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
                return DAYS.filter(day => schedule?.[day] == '1');
            }
            let cp = 0, ca = 0, ap = 0, aa = 0, ch=0, ah=0;
            console.log("result: ", result)
            let data = result.map((d: any) => {
                let commitedDays = getCommitedDays(d?.schedule || {})
                if(commitedDays.length > 0) {
                    cp +=  d?.complience?.present || 0
                    ca += d?.complience?.count -  (d?.complience?.present + (d?.complience?.half))
                    ch += d?.complience?.half || 0
                    ap += d.present;
                    aa += d.absent
                    ah += d.half
                }
                console.log("CP-AP : ", cp, ap, ca, aa, ch, ah)

                // let manager = commonController.getEmployeById(parseInt(d?.ManagerId));
                let manager = managers?.find((mg: any) => mg?.dataValues?.EmployeeId == d?.ManagerId); 
                let compliance = d?.complience?.present +(d?.complience?.half/2) ;
                let attendance = commitedDays.length > 0 ? d?.present + (d?.half/2) : 0 ; 
                let aNaN = isNaN(Math.round((attendance/d?.count) *100))
                return  {
                    EmpId: d.EmployeeId,
                    EmpNumber: d.Number,
                    Username: d.UserName,
                    Name: `${d.FirstName} ${d.LastName}`,
                    Project: d?.project?.project_name,
                    Manager:`${manager?.FirstName || ""} ${manager?.LastName || ""}`,
                    "Work Mode": commitedDays.length > 0 ? "Office" : "Remote",
                    "Work Location" : d.WorkLocation,
                    "Commited Days": commitedDays.join(', '),
                    Present: d?.present +(d?.half /2),
                    Absent: d?.absent +(d?.half/2),
                    Compliance: Math.round((compliance/((d?.complience?.count) || 1)) *100) + '%',
                    Attendance: aNaN ? '0%' : Math.round((attendance/d?.count) *100) + '%'
                }
            })
            console.log("CP-AP final: : ", cp, ca, ch, ap, aa, ah )
            if (data.length > 0) {
                let acount = aa+ap+ah, ccount = cp + ca + ch;
                console.log("acount, ccount: ", acount, ccount)
                const config1 = {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'Compliance Achieved: ' + Math.round(((cp + (ch/2))/ccount) *100)  + '%',
                            'Compliance Not Achieved: ' + Math.round(((ca + (ch/2))/ccount) *100)  + '%',
                          ],
                          datasets: [{
                            label: 'Compliance',
                            data: [
                                Math.round(((cp + (ch/2))/ccount) *100),
                                Math.round(((ca + (ch/2))/ccount) *100)
                            ],
                            backgroundColor: [
                              'green',
                              'red'
                            //   'rgb(54, 162, 235)'
                            ],
                            hoverOffset: 4
                          }]
                    },
                  };

                const config2 = {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'Work-In Office ' + Math.round(((ap + (ah/2))/acount) *100) + '%',
                            'Work-In Remote ' + Math.round(((aa + (ah/2))/acount) *100) + '%',
                          ],
                          datasets: [{
                            label: 'Attendance',
                            data: [
                                Math.round(((ap + (ah/2))/acount) *100),
                                Math.round(((aa + (ah/2))/acount) *100) 
                            ],
                            backgroundColor: [
                              'green',
                              'red'
                            //   'rgb(54, 162, 235)'
                            ],
                            hoverOffset: 4
                          }]
                    },
                  };
                let imageData = await getImageData(config1);
                let imageData2 = await getImageData(config2);
                const xlsBuffer = await generateXLS(data, imageData, imageData2, client, Math.round(((cp + (ch/2))/ccount) *100), Math.round(((ap + (ah/2))/acount) *100), monthList[month]);
                res.set("Content-Disposition", `attachment; filename=report_${client}_${monthList[month]}.xls`);
                res.type("application/vnd.ms-excel");
                res.send(xlsBuffer);
            }
        } catch (err) {
            console.log(err)
            res.json("Something went wrong");
        }
    }

}
