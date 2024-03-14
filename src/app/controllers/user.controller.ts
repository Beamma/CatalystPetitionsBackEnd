import {Request, Response} from "express";
import Logger from '../../config/logger';
import * as schemas from '../resources/schemas.json';
import {validate} from '../../config/ajv';
import * as users from '../models/user.model';



const register = async (req: Request, res: Response): Promise<void> => {
    // TODO, check email, and password, and validate, hash password
    Logger.http(`POST create a user with email: ${req.body.email}`)
    const validation = await validate(
        schemas.user_register, req.body
    );
    if (validation !== true) {
        res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
        res.status(400).send('Failed');
        return;
    }
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

    if (!req.body.email.match(emailRegex)) {
        res.status(400).send(`Invalid email format`);
        return;
    }

    const emailResult = await users.getByEmail(req.body.email);
    Logger.info(`${emailResult.length}`);
    if (emailResult.length !== 0) {
        Logger.info(`Email in use`);
        res.status(403).send(`Email already in use`);
        return;
    }

    try{
        const result = await users.insert(req.body.email, req.body.firstName, req.body.lastName, req.body.password);
        res.status(201).send({"userId": result.insertId});
        return;
    } catch (err) {
        Logger.error(err);
        res.status(500).send(`ERROR creating user ${req.body.email}: ${ err }`);
        return;
    }
}

const login = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`POST login a user with email: ${req.body.email}`)
        const validation = await validate(
            schemas.user_login, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send('Failed');
            return;
        }

        const emailResult = await users.getByEmail(req.body.email);
        if (emailResult.length === 0) {
            res.status(401).send(`Incorrect email`);
            return;
        }

        if (emailResult[0].password !== req.body.password) {
            res.status(401).send(`Incorrect password`);
            return;
        }

        const token = Math.random().toString(36);
        try{
            const result = await users.insertToken(req.body.email, token);
            res.status(200).send({"userId": emailResult[0].id, "token": token});
            return;
        } catch (err) {
            Logger.error(err);
            res.status(500).send(`ERROR logging in user ${req.body.email}: ${ err }`);
            return;
        }


    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const logout = async (req: Request, res: Response): Promise<void> => {
    try{
        Logger.http(`POST Logout user`)
        const webToken = req.headers['x-authorization'];
        Logger.http(webToken);
        const user = await users.getByToken(webToken.toString());
        Logger.http(user.length);

        if (user.length === 0) {
            res.status(401).send(`Unauthorized. Cannot log out if you are not authenticated`);
            return;
        }

        const result = await users.removeToken(webToken.toString());
        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const validateSession = async (id: string, req: Request): Promise<boolean> => {
    const user = await users.getId(id);
    const token = user[0].auth_token;
    const webToken = req.headers['x-authorization'];
    Logger.info(`${token}`);
    Logger.info(`${webToken}`);
    if (webToken === null || token === null) {
        return false;
    }
    return token === webToken;

}

const view = async (req: Request, res: Response): Promise<void> => {

    try{
        const id = req.params.id;
        Logger.info(`id: ${id}`);
        const user = await users.getId(id);
        Logger.info(`user[0]: ${user[0]}`);

        if (user.length === 0) {
            res.status(404).send(`User does not exist`);
            return;
        }


        const email = user[0].email;
        const firstName = user[0].first_name;
        const lastName = user[0].last_name;

        if (await validateSession(id, req)) {
            res.status(200).send({"email": email, "firstName": firstName, "lastName": lastName});
            return;
        } else {
            res.status(200).send({"firstName": firstName, "lastName": lastName});
            return;
        }

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

const update = async (req: Request, res: Response): Promise<void> => {
    try{
        const validation = await validate(
            schemas.user_edit, req.body
        );
        if (validation !== true) {
            res.statusMessage = `Bad Request: ${validation.toString()}`; // ChecK?
            res.status(400).send('Failed');
            return;
        }
        if (req.body.email) {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;

            if (!req.body.email.match(emailRegex)) {
                res.status(400).send(`Invalid email format`);
                return;
            }
        }

        // Get user info for header token
        const id = req.params.id;

        const user = await users.getId(id);
        if (user.length === 0) {
            res.status(404).send(`User does not exist`);
            return;
        }

        if (! await validateSession(id, req)) {
            res.status(401).send(`You cannot edit another users information`);
            return;
        }

        // check current password == dbPassword
        const currentPassword = req.body.currentPassword
        Logger.info(currentPassword);
        Logger.info(user[0].password)
        if (currentPassword !== user[0].password) {
            res.status(401).send(`User does not exist`);
            return;
        }

        // currentpassword != password
        if ( req.body.password === req.body.currentPassword) {
            res.status(403).send(`Password cannot be the same as currentPassword`);
            return;
        }


        let email = "";
        if (req.body.email) {
            email = req.body.email;
        } else {
            email = user[0].email;
        }

        let firstName = "";
        if (req.body.firstName) {
            firstName = req.body.firstName;
        } else {
            firstName = user[0].first_name;
        }

        let lastName = "";
        if (req.body.lastName) {
            lastName = req.body.lastNameName;
        } else {
            lastName = user[0].last_name;
        }

        let pword = "";
        if (req.body.password) {
            pword = req.body.password;
        } else {
            pword = user[0].password;
        }

        const result = await users.alterUser(id, email, firstName, lastName, pword);
        res.status(200).send();
        return;

    } catch (err) {
        Logger.error(err);
        res.statusMessage = "Internal Server Error";
        res.status(500).send();
        return;
    }
}

export {register, login, logout, view, update, validateSession}