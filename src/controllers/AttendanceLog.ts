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
import Path from 'path'

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
async function getImageDataUrl(configuration: any) {
    const dataUrl = await chartJSNodeCanvas.renderToDataURL(configuration);
    const base64Image = dataUrl
    return base64Image;
}


const Jimp = require('jimp');
const JSZip = require('jszip');
var AdmZip = require('adm-zip');
var FileSaver = require('file-saver');

const generateZipV2 = async (excel: any, compliance: any, attendance: any, filename: string) => {
    const zip = new JSZip();
    // const
    zip.file(`${filename}_report.xls`, excel);
    zip.file(`${filename}_compliance.png`, compliance, { base64: true });
    zip.file(`${filename}attendance.png`, attendance, { base64: true });
    // let content = await zip.generateAsync({type:"blob"})
    // await FileSaver.saveAs(content, Path.join(Path.resolve('./'),'sample.zip'));
    // // fs.writeFileSync(Path.join(Path.resolve('./'),'sample.zip'), content)
    // return zip
    await zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
        .pipe(fs.createWriteStream('sample.zip'))
        .on('finish', function () {
            console.log("sample.zip written.");
            return 
        });


    // return await zip.generateAsync({ type: "base64" });

}
const generateZIp = async (excel: any, compliance: any, attendance: any, filename: string) => {
    const zip = new AdmZip();
    zip.addFile(`${filename}_report.xls`, excel);
    // var base64 = new Buffer(overlayImg1.toString(), 'binary').toString('base64');

    zip.addLocalFile('compliance.png')
    zip.addLocalFile('attendance.png')
    // zip.addFile(`${filename}_compliance.png`, Buffer.from("data:image\/png;base64,"+ compliance));
    // zip.addFile(`${filename}_attendance.png`, Buffer.from("data:image\/png;base64,"+ attendance));
    // zip.writeZip("sample.zip");
    return await zip.toBuffer()


    // return await zip.generateAsync({ type: "base64" });

}

async function getTextImage(contents: string[]) {
    let image = new Jimp(400, 150, 'white', (err: any) => {
        if (err) throw err
    })

    return Jimp.loadFont(Jimp.FONT_SANS_16_BLACK)
        .then((font: any) => {
            //   image.print(font, x, y, message)
            contents.forEach((content: String, i: number) => {
                image.print(font, 20, (((i + 1) * 30) + 10), content);
            })
            // image.print(font, 20, 10, 'Expected In-Office Days - 46 days')
            // image.print(font, 20, 40, 'Compliance Achieved - 16 days (Full:14 - Half:4)')
            // image.print(font, 20, 80, 'Compliance Not Achieved - 30 days')
            return image
        }).then((image: any) => {
            let file = `new_name.${image.getExtension()}`
            return image.write(file) // save
        })
}

async function textOverlay(imgData: any, contents: any, fileName: string) {
    let newImage = await new Jimp(400, 550, 'white');
    const image = await Jimp.read(Buffer.from(imgData, 'base64'));
    let sec_img = await getTextImage(contents)
    newImage.composite(image, 0, 0, Jimp.BLEND_SOURCE_OVER)
    newImage.composite(sec_img, 0, 400, Jimp.BLEND_SOURCE_OVER);
    await newImage.writeAsync(fileName);
    // console.log('data---: ', await newImage.getBase64(Jimp.AUTO, (err, res) => {
    //     console.log(res)}))
    let baseB4 = ''
    await newImage.getBase64(Jimp.AUTO, (err, res) => {
        // console.log(res);
        baseB4 = res.replace(/^data:image\/png;base64,/, "");
    })
    //   console.log(baseB4);
    return baseB4;
}

// textOverlay();

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
            if (!projects) {
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
                if (projectAlloc) {
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
            let cp = 0, ca = 0, ap = 0, aa = 0, ch = 0, ah = 0;
            let data = result.map((d: any) => {
                let present = 0, complience = 0, attendance = 0;
                let commitedDays = getCommitedDays(d?.schedule || {})
                if (commitedDays.length > 0) {
                    present = d?.present + (d?.half / 2);
                    attendance = present * 100 / (d.present + d.half + d.absent);
                    complience = (d?.complience?.present / d?.complience?.count) * 100
                    cp += d?.complience?.present || 0
                    ca += d?.complience?.absent || 0
                    ch = d?.complience?.absent || 0
                    ap += d.present;
                    aa += d.absent
                    ah = d.half
                }
                // console.log("CP-AP: ", cp, ap)
                // let manager = commonController.getEmployeById(parseInt(d?.ManagerId));
                let manager = managers?.find((mg: any) => mg?.dataValues?.EmployeeId == d?.ManagerId);
                return {
                    EmpId: d.EmployeeId,
                    EmpNumber: d.Number,
                    Username: d.UserName,
                    Name: `${d.FirstName} ${d.LastName}`,
                    Project: project?.project_name,
                    Manager: `${manager?.FirstName || ""} ${manager?.LastName || ""}`,
                    "Work Mode": commitedDays.length > 0 ? "Office" : "Remote",
                    "Work Location": d.WorkLocation,
                    "Commited Days": commitedDays.join(', '),
                    Present: present,
                    Absent: d.absent + (d.half / 2),
                    Compliance: Math.round(complience),
                    Attendance: Math.round(attendance)
                }
            })
            console.log("CP-AP final: : ", cp, ca, ap, aa, ch, ah)
            if (data.length > 0) {
                const config1 = {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'Present ' + Math.round((cp / (cp + ca)) * 100) + '%',
                            'Absent ' + Math.round((ca / (cp + ca)) * 100) + '%',
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
                            'Absent ' + Math.round((aa / (ap + aa)) * 100) + '%',
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
                const xlsBuffer = await generateXLS(data, imageData, imageData2, `${project?.project_code || ''} ${project?.project_name || ''}`, Math.round((cp / (cp + ca)) * 100), Math.round((ap / (ap + aa)) * 100),);
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
            if (!projects) {
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
                if (projectAlloc) {
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
            let cp = 0, ca = 0, ap = 0, aa = 0, ch = 0, ah = 0;
            console.log("result: ", result)
            let data = result.map((d: any) => {
                let commitedDays = getCommitedDays(d?.schedule || {})
                if (commitedDays.length > 0) {
                    cp += d?.complience?.present || 0
                    ca += d?.complience?.count - (d?.complience?.present + (d?.complience?.half))
                    ch += d?.complience?.half || 0
                    ap += d.present;
                    aa += d.absent
                    ah += d.half
                }
                console.log("CP-AP : ", cp, ap, ca, aa, ch, ah)

                // let manager = commonController.getEmployeById(parseInt(d?.ManagerId));
                let manager = managers?.find((mg: any) => mg?.dataValues?.EmployeeId == d?.ManagerId);
                let compliance = d?.complience?.present + (d?.complience?.half / 2);
                let attendance = commitedDays.length > 0 ? d?.present + (d?.half / 2) : 0;
                let aNaN = isNaN(Math.round((attendance / d?.count) * 100))
                return {
                    EmpId: d.EmployeeId,
                    EmpNumber: d.Number,
                    Username: d.UserName,
                    Name: `${d.FirstName} ${d.LastName}`,
                    Project: d?.project?.project_name,
                    Manager: `${manager?.FirstName || ""} ${manager?.LastName || ""}`,
                    "Work Mode": commitedDays.length > 0 ? "Office" : "Remote",
                    "Work Location": d.WorkLocation,
                    "Commited Days": commitedDays.join(', '),
                    Present: d?.present + (d?.half / 2),
                    Absent: d?.absent + (d?.half / 2),
                    Compliance: Math.round((compliance / ((d?.complience?.count) || 1)) * 100) + '%',
                    Attendance: aNaN ? '0%' : Math.round((attendance / d?.count) * 100) + '%'
                }
            })
            console.log("CP-AP final: : ", cp, ca, ch, ap, aa, ah)
            if (data.length > 0) {
                let acount = aa + ap + ah, ccount = cp + ca + ch;
                console.log("acount, ccount: ", acount, ccount)
                const config1 = {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'Compliance Achieved: ' + Math.round(((cp + (ch / 2)) / ccount) * 100) + '%',
                            'Not Achieved: ' + Math.round(((ca + (ch / 2)) / ccount) * 100) + '%',
                        ],
                        datasets: [{
                            label: 'Compliance',
                            data: [
                                Math.round(((cp + (ch / 2)) / ccount) * 100),
                                Math.round(((ca + (ch / 2)) / ccount) * 100)
                            ],
                            backgroundColor: [
                                'green',
                                'red'
                                //   'rgb(54, 162, 235)'
                            ],
                            hoverOffset: 4
                        }]
                    },

                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: `${client}_${monthList[month]} - Compliance`
                            }
                        }
                    }
                };

                const config2 = {
                    type: 'doughnut',
                    data: {
                        labels: [
                            'Work-In Office ' + Math.round(((ap + (ah / 2)) / acount) * 100) + '%',
                            'Not Work-In Office ' + Math.round(((aa + (ah / 2)) / acount) * 100) + '%',
                        ],
                        datasets: [{
                            label: 'Attendance',
                            data: [
                                Math.round(((ap + (ah / 2)) / acount) * 100),
                                Math.round(((aa + (ah / 2)) / acount) * 100)
                            ],
                            backgroundColor: [
                                'green',
                                'red',
                                'white'
                                //   'rgb(54, 162, 235)'
                            ],
                            hoverOffset: 4
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'top',
                            },
                            title: {
                                display: true,
                                text: `${client}_${monthList[month]} - Attendance`
                            }
                        }
                    }

                };
                let imageData = await getImageData(config1);
                let imageData2 = await getImageData(config2);
                // Expected In-Office Days - 46 days')
                // image.print(font, 20, 40, 'Compliance Achieved - 16 days (Full:14 - Half:4)')
                // image.print(font, 20, 80, 'Compliance Not Achieved - 30 days
                let overlayImg1 = await textOverlay(
                    imageData,
                    [
                    `Expected In-Office        - ${ccount} days`,
                    `Compliance Achieved - ${(cp + (ch / 2))} days (Full:${cp} - Half:${ch})`,
                    `Not Achieved                - ${ca + (ch / 2)} days`
                    ], 'compliance.png')
                let overlayImg2 = await textOverlay(
                    imageData2,
                    [
                    `Total Working         - ${acount} days`,
                    `Work-In Office        - ${(ap + (ah / 2))} days (Full:${ap} - Half:${ah})`,
                    `Not Work-In Office - ${aa + (ah / 2)} days`
                    ], 'attendance.png')

                 let xlsBuffer = await generateXLS(data, overlayImg1, overlayImg2, client, Math.round(((cp + (ch / 2)) / ccount) * 100), Math.round(((ap + (ah / 2)) / acount) * 100), monthList[month]);
                 let buffer = await generateZIp(xlsBuffer, overlayImg1, overlayImg2, `${client}${monthList[month]}`)
                // res.send(zip)
                // var stat = fs.readFileSync('sample.zip');
                let filePath = Path.join(Path.resolve('./'),'sample.zip');
                // const base64String = fs.readFileSync(filePath).toString('base64');
                // let buff = Buffer.from(base64String)
                // res.writeHead(200,{
                //     'Content-Disposition': `attachment; filename="report.zip"`,
                //     'Content-Type': 'application/zip',
                //     // 'Content-Length': buff.size
                // });
                // res.set("Content-Disposition", `attachment; filename=report_${client}_${monthList[month]}.zip`);
                // res.type("application/zip");
                // return res.send(base64String);
                // return res.sendFile(filePath)

                // var stat = fs.statSync(filePath);

                // res.writeHead(200, {
                //     'Content-Type': 'application/zip',
                //     'Content-Length': stat.size
                // });

                // var readStream = fs.createReadStream(filePath);
                // // We replaced all the event handlers with a simple call to readStream.pipe()
                // readStream.pipe(res);

                // var readStream = fs.createReadStream('sample.zip');
                // // We replaced all the event handlers with a simple call to readStream.pipe()
                // readStream.pipe(res);
                // // res.set("Content-Disposition", `attachment; filename=report_${client}_${monthList[month]}.xls`);
                // res.type("application/vnd.ms-excel");
                // res.send(xlsBuffer);
                // res.set({
                //     'Content-Type': 'application/zip',
                //     'Content-Disposition': 'attachment; filename="file.zip"',
                //     'Content-Length': stat.size
                //   })
                //   return res.sendFile(filePath)


                // const {pipeline} = require('stream')
                // pipeline(archive, res)

                // // Alternatively (search for caveats of pipe vs. pipeline)
                // archive.pipe(res)
                // require('./../../sample.zip')
                // const bits = fs.readFileSync(filePath);
                // let zip = new AdmZip(bits);
                // var zipEntries = zip.getEntries();
                // console.log(zipEntries)
                // var zipFileContents = await zip.toBuffer();
                const fileName = 'reports.zip';
                const fileType = 'application/zip';
                res.set("Content-Disposition", `attachment; filename=report_${client}_${monthList[month]}.zip`);
                res.type("application/zip");
                res.send(buffer);
            }
        } catch (err) {
            console.log(err)
            res.json("Something went wrong");
        }
    }

    async exchangeDataMonthlyReport(req: Request, res: Response) {
        try {
            let client = req.params.client;
            let month = parseInt(req.params.month);
            let year = parseInt(req.params.year);
            // let empIds = await commonController.getEmployeesByProject(id);

            let projects = await commonController.getProjectByclient(client);
            if (!projects) {
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
                if (projectAlloc) {
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
            let cp = 0, ca = 0, ap = 0, aa = 0, ch = 0, ah = 0;
            console.log("result: ", result)
            let data = result.map((d: any) => {
                let commitedDays = getCommitedDays(d?.schedule || {})
                if (commitedDays.length > 0) {
                    cp += d?.complience?.present || 0
                    ca += d?.complience?.count - (d?.complience?.present + (d?.complience?.half))
                    ch += d?.complience?.half || 0
                    ap += d.present;
                    aa += d.absent
                    ah += d.half
                }
                console.log("CP-AP : ", cp, ap, ca, aa, ch, ah)

                // let manager = commonController.getEmployeById(parseInt(d?.ManagerId));
                let manager = managers?.find((mg: any) => mg?.dataValues?.EmployeeId == d?.ManagerId);
                let compliance = d?.complience?.present + (d?.complience?.half / 2);
                let attendance = commitedDays.length > 0 ? d?.present + (d?.half / 2) : 0;
                let aNaN = isNaN(Math.round((attendance / d?.count) * 100))
                return {
                    EmpId: d.EmployeeId,
                    EmpNumber: d.Number,
                    Username: d.UserName,
                    Name: `${d.FirstName} ${d.LastName}`,
                    Project: d?.project?.project_name,
                    Manager: `${manager?.FirstName || ""} ${manager?.LastName || ""}`,
                    "Work Mode": commitedDays.length > 0 ? "Office" : "Remote",
                    "Work Location": d.WorkLocation,
                    "Commited Days": commitedDays.join(', '),
                    Present: d?.present + (d?.half / 2),
                    Absent: d?.absent + (d?.half / 2),
                    Compliance: Math.round((compliance / ((d?.complience?.count) || 1)) * 100) + '%',
                    Attendance: aNaN ? '0%' : Math.round((attendance / d?.count) * 100) + '%'
                }
            })

            if (data.length > 0) {
                let acount = aa + ap + ah, ccount = cp + ca + ch;
                let resultData = {
                    compliance: {
                        achieved:`${Math.round(((cp + (ch / 2)) / ccount) * 100)}%`,
                        not_achieved: `${Math.round(((ca + (ch / 2)) / ccount) * 100)}%`,
                        presence: cp,
                        half: ch,
                        absence: ca,
                        total: ccount
                    },
                    attendance: {
                        come_to_office: `${Math.round(((ap + (ah / 2)) / acount) * 100)}%`,
                        not_come_to_office: `${Math.round(((aa + (ah / 2)) / acount) * 100)}%`,
                        presence: ap,
                        half: ah,
                        absence: aa,
                        total: acount
                    },
                    client,
                    month: monthList[month]
                }

               
                res.send(resultData);
            }else {
                res.json("Something went wrong");
            }
        } catch (err) {
            console.log(err)
            res.json("Something went wrong");
        }
    }


    async getAttendanceLogsByManagerByMonth(req: Request, res: Response) {
        try {
            let managerId = parseInt(req.params.managerId);
            let month = parseInt(req.params.month);
            let year = parseInt(req.params.year);
            let manager = await commonController.getEmployeById(managerId);
            if (!manager) {
                throw new Error('Employee is not found')
            }
            let empIds: any[] = await commonController.getEmployeesByManagerId(managerId);
            let projectAllocations = await commonController.getProjectALlocationByEmployeeIds(empIds.map(obj => obj.EmployeeId));
            if (!projectAllocations?.length) {
                throw new Error('Project is not allocated')
            }
            let projects = await commonController.getProjectsByIds(projectAllocations?.map(obj => obj.ProjectID));
            if (!projects?.length) {
                throw new Error('Project is not found')
            }
            let employeeSchedule = await commonController.getEmployeesScheduleByIds(empIds.map(obj => obj.EmployeeId))
            let employees: any = await commonController.getEmployeesByIds(empIds.map(obj => obj.EmployeeId));
            let attendanceLogs = await AttendanceLog.findAll({
                where: {
                    EmployeeNumber: { in: employees.map((obj: any) => obj.Number) },
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
                if (projectAlloc) {
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
                    schedule,
                    project
                }
            })
            res.json(result)

        }
        catch (err) {
            res.json(err);
        }
    }

}
