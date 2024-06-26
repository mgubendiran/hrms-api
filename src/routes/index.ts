import { Router } from 'express';
import { EmployeeController } from '../controllers/Employee';
import { AttendanceLogController } from '../controllers/AttendanceLog';
import { EmployeeScheduleController } from '../controllers/EmployeeSchedule';
import { ProjectController } from '../controllers/Project';

export default class MainRouter {

    router: Router;
    employeeController: EmployeeController;
    attendanceLogController: AttendanceLogController;
    employeeScheduleController: EmployeeScheduleController;
    projectController: ProjectController;

    constructor() {

        // Initialize controllers objects
        this.employeeController = new EmployeeController();
        this.attendanceLogController = new AttendanceLogController();
        this.employeeScheduleController = new EmployeeScheduleController();
        this.projectController = new ProjectController();

        // Initialize router object
        this.router = Router({ mergeParams: true });
        this.userRoutes();

    }

    private userRoutes() {

        this.router.route('/project')
            .get(this.projectController.readAll)
        this.router.route('/project/:id')
            .get(this.projectController.read)
        this.router.route('/project/search')
            .post(this.projectController.search)

        this.router.route('/employee')
            .get(this.employeeController.readAll)
            // .post(this.employeeController.create);
        this.router.route('/employee/schedule')
            .get(this.employeeScheduleController.readAll)
        this.router.route('/employee/project/:projectId')
            .get(this.employeeController.getEmployeesByProject)
        this.router.route('/employee/schedule/:id')
            .get(this.employeeScheduleController.read)
        this.router.route('/employee/schedule/search')
            .post(this.employeeScheduleController.search)
        this.router.route('/employee/:id/dashboard')
            .get(this.employeeController.getEmployeeDashboardDataById)
        this.router.route('/employee/:id')
            .get(this.employeeController.read)
            // .put(this.employeeController.update)
            // .delete(this.employeeController.delete);
        this.router.route('/employees/search')
            .post(this.employeeController.search)
        

        this.router.route('/attendance_log')
            .get(this.attendanceLogController.readAll)
        this.router.route('/attendance_log/:id')
            .get(this.attendanceLogController.read)
        this.router.route('/attendance_log/search')
            .post(this.attendanceLogController.search)
        this.router.route('/attendance_log/employee/:empId')
            .get(this.attendanceLogController.getAttendanceLogsByEmployee)
        this.router.route('/attendance_log/employee/:empId/year/:year/month/:month')
            .get(this.attendanceLogController.getAttendanceLogsByEmployeeByMonth)
        this.router.route('/attendance_log/project/:projectId/year/:year/month/:month')
            .get(this.attendanceLogController.getAttendanceLogsByProjectByMonth)
        this.router.route('/attendance_log/project/:projectId/year/:year/month/:month/export')
            .get(this.attendanceLogController.downloadFile)
        
    }


}