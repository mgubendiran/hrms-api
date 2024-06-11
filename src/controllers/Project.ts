import { Request, Response } from 'express';
import { Project, ProjectInterface } from '../models/Project';
import { paginate, paginationMapper } from '../helper/paginate';
import sequelize, { Op, where, fn, col } from 'sequelize';

export class ProjectController {

    constructor() { }

    readAll(req: Request, res: Response) {
        Project.findAll({
            order: ['project_code', 'project_name']
        })
            .then((users: ProjectInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    getProjectByclient(req: Request, res: Response) {
        Project.findAll({
            // attributes: [
            //     'client_name',
            //     [sequelize.fn('COUNT', sequelize.col('project_id')), 'no_of_projects'],
            //   ],
            // group: ['client_name']
            order: ["client_name"]
        })
            .then((data: any[]) => {
                let hash = data.reduce((p,c) => (p[c.client_name] ? p[c.client_name].push(c) : p[c.client_name] = [c],p) ,{});
                let newData: any = Object.keys(hash).map(k => ({client_name: k, projects: hash[k]}));
                res.json(newData);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    read(req: Request, res: Response) {
        Project.findById(req.params.id)
            .then((user: ProjectInterface | null) => {
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
        Project.findAndCountAll(searchFilter)
            .then((employees: any) => {
                res.json(paginationMapper({ ...employees, ...params }));
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    getProjectsByEmployee(req: Request, res: Response) {
        let id = req.params.empId;
        Project.findAll({
            where: {
                EmployeeNumber: id
            }

        })
            .then((users: ProjectInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    getProjectsByEmployeeByMonth(req: Request, res: Response) {
        let id = req.params.empId;
        let month = parseInt(req.params.month);
        let year = parseInt(req.params.year);
        Project.findAll({
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
            .then((users: ProjectInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }


}
