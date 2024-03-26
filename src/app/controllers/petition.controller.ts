import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model';
import * as categories from '../models/category.model';
import * as schemas from '../resources/schemas.json';
import {validate} from '../../config/ajv';
import * as users from '../models/user.model';
import * as supportTiers from '../models/supportTiers.model';
import * as supporters from '../models/supporter.model';
import { validateSession } from "./user.controller";

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.info("Get all petitions");
        if (! await validateGetAllPetitions(req, res)) {
            return;
        }

        Logger.info('After');

        try{
            const validation = await validate(
                schemas.petition_search, req.query
            );
            if (validation !== true) {
                res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
                res.status(400).send();
                return;
            }

            if (req.query.categoryIds !== undefined) {
                let catIds = [] as string[]

                if(typeof req.query.categoryIds === 'string') {
                    catIds = [req.query.categoryIds];
                } else {
                    catIds = req.query.categoryIds as string[];
                }
                const ids = (await categories.getAllIds()).map(e => e.id);
                Logger.info(ids.toString());
                Logger.info(catIds)
                for (const row of catIds) {
                    if (! (row in ids)) {
                        Logger.info("Failed")
                        res.statusMessage = `Invalid Cat Ids`; // ChecK?
                        res.status(400).send();
                        return;
                    } else {
                        Logger.info(row);
                    }
                }

            }


            let result = await petitions.getAllPetitions(req);
            const startIndex = req.query.startIndex;
            const count = req.query.count;
            const resultLength = result.length;
            if (startIndex !== undefined) {
                result = result.slice(Number(startIndex));
            }

            if (count !== undefined) {
                result = result.slice(0, Number(count));
            }

            for (const item of result) {
                item.numberOfSupporters = parseInt(item.numberOfSupporters, 10)
            }

            res.status(200).send({"petitions": result, "count": resultLength});
            return;
        } catch (err) {
            Logger.error(err);
            res.statusMessage = "ERROR getting all petitions: ${ err }";
            res.status(500).send();
            return;
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


const getPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const petition = await petitions.getExtendedById(id);

        if (petition.length === 0) {
            res.statusMessage = "petition does not exist";
            res.status(404).send();
            return;
        }

        const tiers = await  supportTiers.getByPetitionId(id);

        petition[0].supportTiers = tiers;
        petition[0].numberOfSupporters = parseInt(petition[0].numberOfSupporters, 10)
        petition[0].moneyRaised = parseInt(petition[0].moneyRaised, 10)

        res.status(200).send(petition[0]);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const addPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const webToken = req.headers['x-authorization'];
        if (webToken === undefined) {
            res.statusMessage = 'You are not logged in';
            res.status(401).send();
            return;
        }

        const user = await users.getByToken(webToken.toString());

        if (user.length === 0) {
            res.statusMessage = 'You are not logged in';
            res.status(401).send();
            return;
        }
        const validation = await validate(
            schemas.petition_post, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send();
            return;
        }

        if (! await validateCategory(req)) {
            res.statusMessage = 'Invalid Category';
            res.status(400).send();
            return;
        }

        if (! await validateTitle(req)) {
            res.statusMessage = 'Title is not unique';
            res.status(403).send();
            return;
        }

        if (! await validateTierTitle(req)) {
            res.statusMessage = 'Tier Title is not unique';
            res.status(400).send();
            return;
        }

        const result = await petitions.insert(req, user[0].id);

        for (const row of req.body.supportTiers) {
            const tierResult = await supportTiers.insert(row, result.insertId.toString());
        }

        res.status(201).send({"petitionId": result.insertId});
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const editPetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const petition = await petitions.getById(id);
        if (petition.length === 0) {
            res.statusMessage = "petition does not exist";
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
            schemas.petition_patch, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send();
            return;
        }


        if (! await validateTitle(req)) {
            res.statusMessage = 'Title is not unique';
            res.status(403).send();
            return;
        }

        if (req.body.title === undefined) {
            req.body.title = petition[0].title;
        }

        if (req.body.description === undefined) {
            req.body.description = petition[0].description;
        }

        if (req.body.categoryId === undefined) {
            req.body.categoryId = petition[0].category_id;
        }

        const result = await petitions.update(req, id);

        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const deletePetition = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const petition = await petitions.getById(id);
        if (petition.length === 0) {
            res.statusMessage = "petition does not exist";
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
            res.statusMessage = 'Only the owner of a petition may delete it';
            res.status(403).send();
            return;
        }

        if (! await checkNumSupporters(id)) {
            res.statusMessage = 'Cannot delete as there are supports for this petition';
            res.status(403).send();
            return;
        }

        const result = await petitions.deletePetition(id);

        res.status(200).send();
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        const category = await categories.getAll();

        if (category.length === 0) {
            res.statusMessage = "category does not exist";
            res.status(404).send();
            return;
        }

        res.status(200).send(category);
        return;
    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const validateGetAllPetitions = async (req: Request, res: Response): Promise<boolean> => {
    const sortBy = req.query.sortBy;
    const q = req.query.q;
    const categoryIds = req.query.categoryIds;
    const supportingCost = req.query.supportingCost;
    const ownerId = req.query.ownerId;
    const supporterId = req.query.supporterId;
    const startIndex = req.query.startIndex;
    const count = req.query.count;

    if (q !== undefined) {
        if (q === "") {
            res.statusMessage = "Invalid Query";
            res.status(400).send();
            return false;
        }
    }

    if (startIndex !== undefined) {
        const startIndexRegex = /^[0-9]+$/;
        if (!(startIndex.toString().match(startIndexRegex))) {
            res.statusMessage = "Invalid Start Index";
            res.status(400).send();
            return false;
        }
    }

    if (count !== undefined) {
        const countReg = /^[0-9]+$/;
        if (!(count.toString().match(countReg))) {
            res.statusMessage = "Invalid Count";
            res.status(400).send();
            return false;
        }
    }

    if (categoryIds !== undefined) {
        const catReg = /^\d+(,\d+)*$$/;
        if (!(categoryIds.toString().match(catReg))) {
            res.statusMessage = "Invalid Category Id";
            res.status(400).send();
            return false;
        }
    }

    if (supportingCost !== undefined) {
        const costReg = /^[0-9]+$/;
        if (!(supportingCost.toString().match(costReg))) {
            res.statusMessage = "Invalid Supporting Cost";
            res.status(400).send();
            return false;
        }
    }

    if (ownerId !== undefined) {
        const ownerIdReg = /^[0-9]+$/;
        if (!(ownerId.toString().match(ownerIdReg))) {
            res.statusMessage = "Invalid Owner Id";
            res.status(400).send();
            return false;
        }
    }

    if (supporterId !== undefined) {
        const supporterIdReg = /^[0-9]+$/;
        if (!(supporterId.toString().match(supporterIdReg))) {
            res.statusMessage = "Invalid Supporter Id";
            res.status(400).send();
            return false;
        }
    }

    if (sortBy !== undefined) {
        const vals = ["ALPHABETICAL_ASC", "ALPHABETICAL_DESC", "COST_ASC", "COST_DESC", "CREATED_ASC", "CREATED_DESC"]
        if (!vals.includes(sortBy.toString())) {
            res.statusMessage = "Invalid Order By";
            res.status(400).send();
            return false;
        }
    }



    return true;
}

const validateCategory = async (req: Request): Promise<boolean> => {
    const category = await categories.getById(req.body.categoryId);
    if (category.length === 0) {
        return false;
    }

    return true;
}

const validateTitle = async (req: Request): Promise<boolean> => {
    const petition = await petitions.getByTitle(req.body.title);
    if (petition.length === 0) {
        return true;
    }

    return false;
}

const validateTierTitle = async (req: Request): Promise<boolean> => {
    const tiers = req.body.supportTiers;
    const tiersIds = []
    for (const row of tiers) {
        tiersIds.push(row.title);
    }

    const setTiersIds = new Set(tiersIds);
    if (setTiersIds.size !== tiersIds.length) {
        return false;
    }

    return true;
}

const checkNumSupporters = async (id: string): Promise<boolean> => {

    const supporter = await supporters.getByPetitionId(id);
    Logger.info(supporter);
    if (supporter.length === 0) {
        return true;
    }

    return false;
}


export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories, validateTierTitle};