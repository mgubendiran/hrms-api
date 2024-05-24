import { Request, Response } from 'express';
import { EmployeeSchedule, EmployeeScheduleInterface } from '../models/EmployeeSchedule';
import { paginate, paginationMapper } from '../helper/paginate';

export class EmployeeScheduleController {

    constructor() { }

    readAll(req: Request, res: Response) {
        EmployeeSchedule.findAll({})
            .then((users: EmployeeScheduleInterface[]) => {
                res.json(users);
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

    read(req: Request, res: Response) {
        EmployeeSchedule.findById(req.params.id)
            .then((user: EmployeeScheduleInterface | null) => {
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
        EmployeeSchedule.findAndCountAll(searchFilter)
            .then((employees: any) => {
                res.json(paginationMapper({...employees, ...params}));
            })
            .catch((err: any) => {
                res.json(err);
            });
    }

}