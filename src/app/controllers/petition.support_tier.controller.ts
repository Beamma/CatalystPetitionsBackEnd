import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as supportTiers from '../models/supportTiers.model';
import * as petitions from '../models/petition.model';
import { validateSession } from "./user.controller";
import * as schemas from '../resources/schemas.json';
import {validate} from '../../config/ajv';

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        const id = req.params.id;
        const petition = await petitions.getById(id);

        if (petition.length === 0) {
            res.status(404).send(`petition does not exist`);
            return;
        }

        const tiers = await supportTiers.getByPetitionId(id);
        if (tiers.length >= 3) {
            res.status(403).send(`Already 3 Support Tiers`);
            return;
        }

        Logger.debug(petition[0]);
        if (! await validateSession(petition[0].owner_id.toString(), req)) {
            res.status(403).send('Only the owner of a petition may change it');
            return;
        }


        const validation = await validate(
            schemas.support_tier_post, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send('Failed');
            return;
        }

        if (! await validateTierTitle(req, tiers)) {
            res.status(403).send('Tier Title is not unique');
            return;
        }

        const tierResult = await supportTiers.insert(req.body, id);

        res.status(201).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editSupportTier = async (req: Request, res: Response): Promise<void> => {
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

const deleteSupportTier = async (req: Request, res: Response): Promise<void> => {
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

const validateTierTitle = async (req: Request, tiers: Tier[]): Promise<boolean> => {
    const tiersIds = []
    for (const x of tiers) {
        tiersIds.push(x.title);
    }

    if (tiersIds.includes(req.body.title)) {
        return false;
    }
    return true;
}

export {addSupportTier, editSupportTier, deleteSupportTier};