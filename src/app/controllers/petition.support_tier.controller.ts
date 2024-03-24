import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as supportTiers from '../models/supportTiers.model';
import * as petitions from '../models/petition.model';
import * as supporters from '../models/supporter.model';
import { validateSession } from "./user.controller";
// import { checkNumSupporters } from "./petition.controller";
import * as schemas from '../resources/schemas.json';
import {validate} from '../../config/ajv';

const addSupportTier = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        const id = req.params.id;
        const petition = await petitions.getById(id);

        if (petition.length === 0) {
            res.statusMessage = `petition does not exist`;
            res.status(404).send();
            return;
        }

        const tiers = await supportTiers.getByPetitionId(id);
        if (tiers.length >= 3) {
            res.statusMessage = `Already 3 Support Tiers`;
            res.status(403).send();
            return;
        }

        const webToken = req.headers['x-authorization'];
        if (webToken === undefined) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (! await validateSession(petition[0].owner_id.toString(), req)) {
            res.statusMessage = 'Only the owner of a petition may change it';
            res.status(403).send();
            return;
        }

        const validation = await validate(
            schemas.support_tier_post, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send();
            return;
        }

        if (! await validateTierTitle(req, tiers)) {
            res.statusMessage = 'Tier Title is not unique';
            res.status(403).send();
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
        const id = req.params.id;
        const tierId = req.params.tierId;
        const petition = await petitions.getById(id);

        if (petition.length === 0) {
            res.statusMessage = `petition does not exist`;
            res.status(404).send();
            return;
        }

        const tier = await supportTiers.getById(tierId);
        const tiers = await supportTiers.getByPetitionId(id);

        if (tier.length === 0) {
            res.statusMessage = `supportTier does not exist`;
            res.status(404).send();
            return;
        }

        const webToken = req.headers['x-authorization'];
        if (webToken === undefined) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        if (! await validateSession(petition[0].owner_id.toString(), req)) {
            res.statusMessage = 'Only the owner of a petition may change it';
            res.status(403).send();
            return;
        }

        const validation = await validate(
            schemas.support_tier_patch, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send();
            return;
        }

        if (! await checkNumSupporters(tierId)) {
            res.statusMessage = 'Cannot edit as there are supporters for this tier';
            res.status(403).send();
            return;
        }

        if (req.body.title !== undefined) {
            if (! await validateTierTitle(req, tiers)) {
                res.statusMessage = 'Tier Title is not unique';
                res.status(403).send();
                return;
            }
        }

        if (req.body.title === undefined) {
            req.body.title = tier[0].title;
        }

        if (req.body.description === undefined) {
            req.body.description = tier[0].description;
        }

        if (req.body.cost === undefined) {
            req.body.cost = tier[0].cost;
        }

        const result = await supportTiers.update(req, tierId);

        res.status(200).send();
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
        const id = req.params.id;
        const tierId = req.params.tierId;
        const petition = await petitions.getById(id);

        if (petition.length === 0) {
            res.statusMessage = `petition does not exist`;
            res.status(404).send();
            return;
        }

        const tier = await supportTiers.getById(tierId);
        const tiers = await supportTiers.getByPetitionId(id);

        if (tier.length === 0) {
            res.statusMessage = `supportTier does not exist`;
            res.status(404).send();
            return;
        }

        const webToken = req.headers['x-authorization'];
        if (webToken === undefined) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }

        if (! await validateSession(petition[0].owner_id.toString(), req)) {
            res.statusMessage = 'Only the owner of a petition may remove it';
            res.status(403).send();
            return;
        }

        if (! await checkNumSupporters(tierId)) {
            res.statusMessage = 'Cannot remove as there are supporters for this tier';
            res.status(403).send();
            return;
        }

        if (tiers.length <= 1) {
            res.statusMessage = 'Cannot remove it as this is the only tier';
            res.status(403).send();
            return;
        }

        const result = await supportTiers.deleteTier(tierId);

        res.status(200).send();
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

const checkNumSupporters = async (id: string): Promise<boolean> => {

    const supporter = await supporters.getByTierId(id);
    Logger.info(supporter);
    if (supporter.length === 0) {
        return true;
    }

    return false;
}


export {addSupportTier, editSupportTier, deleteSupportTier};