import { Employee, EmployeeInterface } from '../models/Employee';
import { EmployeeSchedule } from '../models/EmployeeSchedule';
import { Project, ProjectInterface } from '../models/Project';
import { ProjectAllocation, ProjectAllocationInterface } from '../models/ProjectAllocation';



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


}