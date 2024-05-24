import { Request, Response } from 'express';
import { AttendanceLog, AttendanceLogInterface } from '../models/AttendenceLog';
import { paginate, paginationMapper } from '../helper/paginate';
import { Op, where, fn, col } from 'sequelize';
import { CommonController } from '../helper/common';
import { EmployeeInterface } from '../models/Employee';

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
        let id =parseInt(req.params.projectId);
        let month = parseInt(req.params.month);
        let year = parseInt(req.params.year);
        let empIds= await commonController.getEmployeesByProject(id);
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
            logs = logs.map((obj:any) => {
                return {...obj.dataValues, day: commonController.getDay(obj.dataValues.AttendanceDate)}
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
                let isComplience = schedule ? schedule[element.day] == '1' ? true: false : false;
                isComplience? ++complience.count: null;
                switch(element.StatusCode) {
                    case 'P': ++present; isComplience? ++complience.present: null ;break;
                    case 'A': ++absent; break;
                    case '½P': ++half;isComplience? ++complience.present: null; break;
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
       catch(err) {
        res.json(err);
       }
            // .then((users: AttendanceLogInterface[]) => {
            //     res.json(users);
            // })
            // .catch((err: any) => {
            //     res.json(err);
            // });
    }

}
