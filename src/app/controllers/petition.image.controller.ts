import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitions from '../models/petition.model';
import { lookup } from "mime-types";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const petition = await petitions.getById(id);
        if (petition.length === 0) {
            res.status(404).send(`petition does not exist`);
            return;
        }

        if (petition[0].image_filename === null) {
            res.status(404).send(`Petition does not have an image`);
            return;
        }

        const imageName = petition[0].image_filename;
        const dir = "./storage/images/";
        const imageDir = dir.concat(imageName);
        const imageType = lookup(imageDir) as string;
        Logger.info(imageDir);

        const image = await petitions.getImage(imageDir);
        res.status(200).type(imageType).send(image);
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const setImage = async (req: Request, res: Response): Promise<void> => {
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


export {getImage, setImage};