import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.model';
import * as petitions from '../models/petition.model';
import * as supporters from '../models/supporter.model';
import * as supportTiers from '../models/supportTiers.model';
import { validateSession } from "./user.controller";
import {validate} from '../../config/ajv';
import * as schemas from '../resources/schemas.json';


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
        const id = req.params.id;
        const petition = await petitions.getById(id);
        const tierId = req.body.supportTierId;
        const tier = await supportTiers.getById(tierId);
        if (petition.length === 0) {
            res.status(404).send(`petition does not exist`);
            return;
        }

        const webToken = req.headers['x-authorization'];
        if (webToken === undefined) {
            res.status(401).send('Unauthorized');
            return;
        }
        if (await validateSession(petition[0].owner_id.toString(), req)) {
            res.status(403).send('Cannot support your own petition');
            return;
        }

        const validation = await validate(
            schemas.supporters_post, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send('Failed');
            return;
        }

        if (tier.length === 0) {
            res.status(404).send(`Suppoerter Tier does not exist`);
            return;
        }

        const user = await users.getByToken(webToken.toString());

        if (await checkForAlreadySupport(user[0].id, tierId)) {
            res.status(403).send('You already support this tier');
            return;
        }

        const result = await supporters.insert(req, id, tierId, user[0].id)

        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const checkForAlreadySupport = async (userId: string, tierId: string): Promise<boolean> => {

    const result = await supporters.checkSupport(userId, tierId);
    if (result.length === 0) {
        return false;
    }

    return true;
}

export {getAllSupportersForPetition, addSupporter}