import { Request, Response } from 'express';
import { Employee, EmployeeInterface } from '../models/Employee';
import { paginate, paginationMapper } from '../helper/paginate';
import { EmployeeSchedule } from '../models/EmployeeSchedule';
import { CommonController } from '../helper/common';
import { load } from 'dotenv';
import { ProjectAllocation } from '../models/ProjectAllocation';

const commonController = new CommonController()
export class EmployeeController {

    // commonController: CommonController;

    constructor() {
        // this.commonController = new CommonController()
     }

    readAll(req: Request, res: Response) {
        Employee.findAll({
            include: [EmployeeSchedule]
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