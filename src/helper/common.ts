import { Employee, EmployeeInterface } from '../models/Employee';
import { EmployeeSchedule } from '../models/EmployeeSchedule';
import { Project, ProjectInterface } from '../models/Project';
import { ProjectAllocation, ProjectAllocationInterface } from '../models/ProjectAllocation';
import syncData from './../db.sync-up'
import { Request, Response } from 'express';


export class CommonController {

    constructor() { }

    async getEmployeesByProject(id: number) {
       let result = await ProjectAllocation.findAll({
            where: {
                ProjectID: id,
                // IsReleased: false
            }
        }).catch((err: any) => {
            throw err
        });
        console.log(result);
        return result
    }
    async getEmployeesByProjects(ids: number[]) {
        let result = await ProjectAllocation.findAll({
             where: {
                 ProjectID : {in : ids},
             }
         }).catch((err: any) => {
             throw err
         });
         console.log(result);
         return result
     }

    async getProjectById(id: number) {
        let result = await Project.findOne({
             where: {
                project_id: id
             }
         }).catch((err: any) => {
             throw err
         });
         return result
    }
    
    async getProjectByclient(client: string) {
        let result = await Project.findAll({
             where: {
                client_name: client
             }
         }).catch((err: any) => {
             throw err
         });
         return result
    }

    async getEmployeesByIds(ids: number[]) {
        let result = await Employee.findAll({
             where: {
                EmployeeId: {in: ids},
                IsActive: true
             },
             order: ["FirstName", "LastName"]
         }).catch((err: any) => {
             throw err
         });
         return result
    }

    async getEmployeesScheduleByIds(ids: number[]) {
        let result = await EmployeeSchedule.findAll({
             where: {
                EmployeeID: {in: ids}
             }
         }).catch((err: any) => {
             throw err
         });
         return result
    }
    async getEmployeById(id: number) {
        let result = await Employee.findById(id).catch((err: any) => {
             throw err
         });
         return result
    }

    async getEmployeesByManagerId(id: number) {
        let result = await Employee.findAll({
             where: {
                ManagerId: id,
                IsActive: true
             },
             order: ["FirstName", "LastName"]
         }).catch((err: any) => {
             throw err
         });
         return result
    }

    async getEmployeeById(id: number) {
        let result = await Employee.findOne({
            where: {
                EmployeeId: id
            }
        }).catch((err: any) => {
            throw err
        })
         return result
    }

    async getProjectsByIds(ids: number[]) {
        let result = await Project.findAll({
             where: {
                project_id: { in: ids}
             }
         }).catch((err: any) => {
             throw err
         });
         return result
    }

    async getProjectALlocationByEmployeeIds(ids: number[]) {
        let result = await ProjectAllocation.findAll({
            where: {
                EmployeeID: {in: ids},
                // IsReleased: false
            }
        }).catch((err: any) => {
            throw err
        });
        console.log(result);
        return result
    }


    getDay = (date: string) => {
        let day = ''
        if(date) {
            let d = new Date(date).getDay()
            switch(d) {
                case 0: day = "Sunday"; break;
                case 1: day = "Monday"; break;
                case 2: day = "Tuesday"; break;
                case 3: day = "Wednesday"; break;
                case 4: day = "Thursday"; break;
                case 5: day = "Friday"; break;
                case 6: day = "Saturday"; break;
            }
        }
        return day;
    }

    async dbSyncUp(req: Request, res: Response) {
        syncData()
        .then(data => console.log('sync-up is done : ', data))
        .catch(err => console.log('sync-up error: ', err))
        return res.json({masg: 'sync-up is started'})
    }


}