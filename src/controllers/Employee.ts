import { Request, Response } from 'express';
import { Employee, EmployeeInterface } from '../models/Employee';
import { paginate, paginationMapper } from '../helper/paginate';
import { EmployeeSchedule, EmployeeScheduleInterface } from '../models/EmployeeSchedule';
import { CommonController } from '../helper/common';
// import { load } from 'dotenv';
import { ProjectAllocation, ProjectAllocationInterface } from '../models/ProjectAllocation';
import { Project, ProjectInterface } from '../models/Project';
import { AttendanceLog } from '../models/AttendenceLog';

const commonController = new CommonController()
export class EmployeeController {

    // commonController: CommonController;

    constructor() {
        // this.commonController = new CommonController()
     }

    readAll(req: Request, res: Response) {
        Employee.findAll({
            where: {
                IsActive: true
            },
            order: ["FirstName", "LastName"],

            // include: [EmployeeSchedule]
        })
            .then((users: EmployeeInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    read(req: Request, res: Response) {
        Employee.findById(req.params.id)
            .then((user: EmployeeInterface | null) => {
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

    async getEmployeeDashboardDataById(req: Request, res: Response) {
        try{
            let empId = req.params?.id;
            console.log(empId)
            let data: any = {}
            let employee: any = await Employee.findById(empId);
            if(employee) {
                data.manager = await Employee.findById(employee.ManagerId); ;
                let schedule: EmployeeScheduleInterface[] = await EmployeeSchedule.findAll({where: {EmployeeId: empId}});
                data.schedule = schedule?.[0] || null;
            }
            else{
                throw new Error('employee not found')
            }
            if(employee) {
                let projectAllocation: ProjectAllocationInterface[] =await  ProjectAllocation.findAll({where: {EmployeeId: empId}});
                if(projectAllocation?.[0]) {
                    let project: any = await Project.findById(projectAllocation[0].ProjectID);
                    data.project = project;
                }
            }
            if(employee) {
                let attendance_logs = await AttendanceLog.findAll({
                    where: {EmployeeNumber: employee.Number}
                });
                data.attendance_logs = attendance_logs
            }
            res.json({...data, ...(employee?.dataValues)});
        }
        catch(err: any) {
            res.json(err);
        }
        // let empId = req.params?.id;
        // console.log(empId)
        // Employee.findById(empId)
        //     .then((user: EmployeeInterface | null) => {
        //         if (user) {
        //             res.json(user);
        //         } else {
        //             res.status(204).send();
        //         }
        //     })
        //     .then(user)
        //     .catch((err: any) => {
        //         res.json(err);
        //     });
    }

    search(req: Request, res: Response) {
        let filter = req.body || {};
        let params = req.query || {};
        let searchFilter = paginate(filter, params)
        Employee.findAndCountAll(searchFilter)
            .then((employees: any) => {
                res.json(paginationMapper({...employees, ...params}));
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

   async getEmployeesByProject(req: Request, res: Response) {
        try {
            let id = req.params.projectId ;
            const result: any = {}
            // get employees from project allocation
            let project = await commonController.getProjectById(id);
            if(!project) {
                throw new Error('project not found')
            }
            result.project = project;

           let projectAllocationlist = commonController.getEmployeesByProject(parseInt(id));
           let employeeIds = (await projectAllocationlist).map(obj => obj.EmployeeID);
           result.employeeIds = employeeIds;

           let employees= await commonController.getEmployeesByIds(employeeIds);
           result.employees = employees;

        //    console.log(employeeIds)
            res.json(result)
        }
        catch(err) {
            res.json(err);
        }
        

    }

    create(req: Request, res: Response) {
        Employee.create(req.body)
            .then((user: EmployeeInterface) => {
                res.json(user);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    update(req: Request, res: Response) {
        Employee.update(req.body, {
            fields: Object.keys(req.body),
            where: { id: req.params.id }
        }).then((affectedRows: [number, EmployeeInterface[]]) => {
            res.json({
                affectedRows: Number(affectedRows)
            });
        }).catch((err: any) => {
            res.json(err);
        })
    }

    delete(req: Request, res: Response) {
        Employee.destroy({
            where: { id: req.params.id }
        })
            .then((removedRows: number) => {
                res.json({
                    removedRows: removedRows
                });
            }).catch((err: any) => {
                res.json(err);
            })

    }
}