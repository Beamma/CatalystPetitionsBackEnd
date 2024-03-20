import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitions from '../models/petition.model';
import * as supporters from '../models/supporter.model';


const getAllSupportersForPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const petition = await petitions.getById(id);
        if (petition.length === 0) {
            res.status(404).send(`petition does not exist`);
            return;
        }

        const supporter = await supporters.getByPetitionIdReversed(id);

        res.status(200).send(supporter);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addSupporter = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        res.statusMessage = "Not Implemented Yet!";
        res.status(501).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {getAllSupportersForPetition, addSupporter}