import {Request, Response} from "express";
import Logger from "../../config/logger";
import * as users from '../models/user.model';
import { validateSession } from './user.controller';
import { lookup } from "mime-types";

const getImage = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        const id = req.params.id;
        Logger.info(`id: ${id}`);
        const user = await users.getId(id);
        Logger.info(`user[0]: ${user[0]}`);

        if (user.length === 0) {
            res.statusMessage = `User does not exist`;
            res.status(404).send();
            return;
        }

        if (user[0].image_filename === null) {
            res.statusMessage = `User does not have an image`;
            res.status(404).send();
            return;
        }

        const imageName = user[0].image_filename;
        const dir = "./storage/images/";
        const imageDir = dir.concat(imageName);
        const imageType = lookup(imageDir) as string;
        Logger.info(imageDir);

        const image = await users.getImage(imageDir);
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
        Logger.info(`id: ${id}`);
        const user = await users.getId(id);
        Logger.info(`user[0]: ${user[0]}`);

        if (user.length === 0) {
            res.statusMessage = `User does not exist`;
            res.status(404).send();
            return;
        }

        const webToken = req.headers['x-authorization'];
        if (webToken === undefined) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const validSession = await validateSession(id, req);
        if (!validSession) {
            res.statusMessage = 'You cant set another users image';
            res.status(403).send();
            return;
        }

        const image = req.body;
        const header = req.headers["content-type"];
        const fileType = header.split("/")[1];
        Logger.debug(req.body.length);


        const imageName = "user_" + id + "." + fileType;

        if (! await validateImage(fileType)) {
            res.statusMessage = `Invalid image`;
            res.status(400).send();
            return;
        }

        const fileDir = "./storage/images/" + imageName;

        let status = 200;
        if (user[0].image_filename === null) {
            status = 201;
        }

        try{
            const result = users.uploadImage(fileDir, image, imageName, id);
            res.status(status).send();
            return;
        } catch (err) {
            Logger.error(err);
            res.statusMessage = `ERROR logging in user ${req.body.email}: ${ err }`;
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

const deleteImage = async (req: Request, res: Response): Promise<void> => {
    try{
        // Your code goes here
        const id = req.params.id;
        Logger.info(`id: ${id}`);
        const user = await users.getId(id);

        if (user.length === 0) {
            res.statusMessage = `User does not exist`;
            res.status(404).send();
            return;
        }

        const webToken = req.headers['x-authorization'];
        if (webToken === undefined) {
            res.statusMessage = 'Unauthorized';
            res.status(401).send();
            return;
        }
        const validSession = await validateSession(id, req);
        if (!validSession) {
            res.statusMessage = `You cant delete another users image`;
            res.status(403).send();
            return;
        }

        const imageName = user[0].image_filename;
        const fileDir = "./storage/images/" + imageName;

        if (imageName === null) {
            res.statusMessage = 'User does not have an image';
            res.status(400).send();
            return;
        }

        try{
            const result = users.removeImage(fileDir, id);
            res.status(200).send();
            return;
        } catch (err) {
            Logger.error(err);
            res.statusMessage = `ERROR deleting photo in user ${id}: ${ err }`;
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

const validateImage = async (fileType: string): Promise<boolean> => {
    return (fileType === "png" || fileType === "jpeg" || fileType === "gif");
}

export {getImage, setImage, deleteImage, validateImage}