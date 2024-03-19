import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as petitions from '../models/petition.model';

const getAllPetitions = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.info("Get all petitions");
        if (!validateGetAllPetitions(req, res)) {
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

const addPetition = async (req: Request, res: Response): Promise<void> => {
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

const editPetition = async (req: Request, res: Response): Promise<void> => {
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
        const catReg = /^[0-9+,]+$/;
        if (!(categoryIds.toString().match(catReg))) {
            res.status(400).send("Invalid Category Id");
            return false;
        }
    }





    return true;
}

export {getAllPetitions, getPetition, addPetition, editPetition, deletePetition, getCategories};