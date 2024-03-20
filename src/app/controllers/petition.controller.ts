import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model';
import * as categories from '../models/category.model';
import * as schemas from '../resources/schemas.json';
import {validate} from '../../config/ajv';
import * as users from '../models/user.model';
import * as supportTiers from '../models/supportTiers.model';
import { validateSession } from "./user.controller";

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.info("Get all petitions");
        if (! await validateGetAllPetitions(req, res)) {
            return;
        }

        Logger.info('After');

        try{
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

            res.status(200).send({"petitions": result, "count": resultLength});
            return;
        } catch (err) {
            Logger.error(err);
            res.status(500).send(`ERROR getting all petitions: ${ err }`);
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
            res.status(404).send(`petition does not exist`);
            return;
        }


        res.status(200).send(petition);
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
            res.status(401).send('You are not logged in');
            return;
        }

        const user = await users.getByToken(webToken.toString());

        if (user.length === 0) {
            res.status(401).send('You are not logged in');
            return;
        }
        const validation = await validate(
            schemas.petition_post, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send('Failed');
            return;
        }

        if (! await validateCategory(req)) {
            res.status(400).send('Invalid Category');
            return;
        }

        if (! await validateTitle(req)) {
            res.status(403).send('Title is not unique');
            return;
        }

        if (! await validateTierTitle(req)) {
            res.status(400).send('Tier Title is not unique');
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
            res.status(404).send(`petition does not exist`);
            return;
        }

        if (! await validateSession(petition[0].owner_id.toString(), req)) {
            res.status(403).send('Only the owner of a petition may change it');
            return;
        }

        const validation = await validate(
            schemas.petition_patch, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send('Failed');
            return;
        }


        if (! await validateTitle(req)) {
            res.status(403).send('Title is not unique');
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

const getCategories = async(req: Request, res: Response): Promise<void> => {
    try{
        const category = await categories.getAll();

        if (category.length === 0) {
            res.status(404).send(`category does not exist`);
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
            res.status(400).send("Invalid Query");
            return false;
        }
    }

    if (startIndex !== undefined) {
        const startIndexRegex = /^[0-9]+$/;
        if (!(startIndex.toString().match(startIndexRegex))) {
            res.status(400).send("Invalid Start Index");
            return false;
        }
    }

    if (count !== undefined) {
        const countReg = /^[0-9]+$/;
        if (!(count.toString().match(countReg))) {
            res.status(400).send("Invalid Count");
            return false;
        }
    }

    if (categoryIds !== undefined) {
        const catReg = /^\d+(,\d+)*$$/;
        if (!(categoryIds.toString().match(catReg))) {
            res.status(400).send("Invalid Category Id");
            return false;
        }
    }

    if (supportingCost !== undefined) {
        const costReg = /^[0-9]+$/;
        if (!(supportingCost.toString().match(costReg))) {
            res.status(400).send("Invalid Supporting Cost");
            return false;
        }
    }

    if (ownerId !== undefined) {
        const ownerIdReg = /^[0-9]+$/;
        if (!(ownerId.toString().match(ownerIdReg))) {
            res.status(400).send("Invalid Owner Id");
            return false;
        }
    }

    if (supporterId !== undefined) {
        const supporterIdReg = /^[0-9]+$/;
        if (!(supporterId.toString().match(supporterIdReg))) {
            res.status(400).send("Invalid Supporter Id");
            return false;
        }
    }

    if (sortBy !== undefined) {
        const vals = ["ALPHABETICAL_ASC", "ALPHABETICAL_DESC", "COST_ASC", "COST_DESC", "CREATED_ASC", "CREATED_DESC"]
        if (!vals.includes(sortBy.toString())) {
            res.status(400).send("Invalid Order By");
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

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};