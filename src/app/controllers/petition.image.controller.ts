import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as petitions from '../models/petition.model';
import { lookup } from "mime-types";
import { validateSession } from "./user.controller";
import { validateImage } from "./user.image.controller";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = req.params.id;
        const petition = await petitions.getById(id);
        if (petition.length === 0) {
            res.statusMessage = `petition does not exist`;
            res.status(404).send();
            return;
        }

        if (petition[0].image_filename === null) {
            res.statusMessage = `Petition does not have an image`;
            res.status(404).send();
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
        const id = req.params.id;
        const petition = await petitions.getById(id);
        if (petition.length === 0) {
            res.statusMessage = `petition does not exist`;
            res.status(404).send();
            return;
        }

        let status = 200;
        if (petition[0].image_filename === null) {
            status = 201;
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

        const image = req.body;
        const header = req.headers["content-type"];
        const fileType = header.split("/")[1];

        Logger.debug(req.body.length);

        const imageName = "petition_" + id + "." + fileType;

        if (! await validateImage(fileType)) {
            res.statusMessage = 'Invalid image type';
            res.status(400).send();
            return;
        }

        const fileDir = "./storage/images/" + imageName;

        const result = petitions.uploadImage(fileDir, image, imageName, id);
        res.status(status).send();
        return;


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}


export {getImage, setImage};