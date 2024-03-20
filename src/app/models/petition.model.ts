import {Request, Response} from "express";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import { getPool } from '../../config/db';

const getAllPetitions = async (req: Request) => {
    const sortBy = req.query.sortBy;

    const q = req.query.q;
    const categoryIds = req.query.categoryIds;
    const supportingCost = req.query.supportingCost;
    const ownerId = req.query.ownerId;
    const supporterId = req.query.supporterId;

    let where = false;

    let whereString = "";
    let having = "";

    if (supportingCost !== undefined) {
        having += "HAVING supportingCost <= " + supportingCost
    }

    if (q !== undefined) {
        if (where === false) {
            where = true;
            whereString += "WHERE (lower(petition.title) LIKE '%" + q +"%' OR lower(petition.description) LIKE '%" + q +"%')";
        } else {
            whereString += " AND (lower(petition.title) LIKE '%" + q + "%' OR lower(petition.description) LIKE '%" + q +"%')";
        }
    }

    if (categoryIds !== undefined) {
        const catIds = categoryIds.toString().split(',');
        if (where === false) {
            where = true;
            whereString += "WHERE (";
            for (let index = 0; index < catIds.length-1; index++) {
                whereString += "petition.category_id = " + catIds[index] + " or "
            }

            whereString += "petition.category_id = " + catIds[catIds.length-1] +")"
        } else {
            whereString += "AND (";
            for (let index = 0; index < catIds.length-1; index++) {
                whereString += "petition.category_id = " + catIds[index] + " or "
            }

            whereString += "petition.category_id = " + catIds[catIds.length-1] +")"
        }
    }

    if (ownerId !== undefined) {
        if (where === false) {
            where = true;
            whereString += "WHERE (owner_id = " + ownerId + ")";
        } else {
            whereString += " AND (owner_id = " + ownerId + ")";
        }
    }

    let order = "ORDER BY creationDate ASC";
    if (sortBy !== undefined) {
        if (sortBy === "ALPHABETICAL_ASC") {
            order = "ORDER BY petition.title ASC, petitionId ASC";
        } else if (sortBy === "ALPHABETICAL_DESC") {
            order = "ORDER BY petition.title DESC, petitionId ASC";
        } else if (sortBy === "COST_ASC") {
            order = "ORDER BY supportingCost ASC, petitionId ASC";
        } else if (sortBy === "COST_DESC") {
            order = "ORDER BY supportingCost DESC, petitionId ASC";
        } else if (sortBy === "CREATED_ASC") {
            order = "ORDER BY creationDate ASC, petitionId ASC";
        } else if (sortBy === "CREATED_DESC") {
            order = "ORDER BY creationDate DESC, petitionId ASC";
        }
    }

    const supporterString = supporterId !== undefined ? `WHERE supporter.user_id = ${supporterId}` : ""
    const query = `
               SELECT
                   petition.id as petitionId,
                   petition.title,
                   petition.description,
                   petition.category_id as categoryId,
                   owner_id as ownerId,
                   first_name as ownerFirstName,
                   last_name as ownerLastName,
                   SUM(nSupp) as numberOfSupporters,
                   creation_date as creationDate,
                   MIN(cost) as supportingCost
               FROM (
                   SELECT support_tier.petition_id, cost, COUNT(supporter.id) as nSupp
                   FROM support_tier LEFT JOIN supporter ON (supporter.support_tier_id = support_tier.id)
                   ${supporterString}
                   GROUP BY support_tier.petition_id, support_tier_id
                   ORDER BY support_tier.id ASC
               ) as petition_support LEFT JOIN petition on (petition.id = petition_support.petition_id)
               LEFT JOIN user on (petition.owner_id = user.id)
               ${whereString}
               GROUP BY petition.id
               ${having}
               ${order}`
    Logger.info(query);
    const conn = await getPool().getConnection();
    const [result] = await conn.query(query);
    await conn.release();
    return result;
}

const getById = async (id: string): Promise<User[]> => {
    Logger.info(`Getting petition ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM petition WHERE id = (?)';
    const [result] = await conn.query(query,[id]);
    await conn.release();
    return result;
}

const getByTitle = async (title: string): Promise<User[]> => {
    Logger.info(`Getting petition ${title} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM petition WHERE title = (?)';
    const [result] = await conn.query(query,[title]);
    await conn.release();
    return result;
}

const insert = async (req: Request, OwnerId: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding petition to the database`);
    Logger.info(OwnerId);
    const now = new Date();
    const sqlDatetime = now.toISOString().slice(0, 19).replace('T', ' ');
    const conn = await getPool().getConnection();
    const query = 'insert into petition (title, description, creation_date, image_filename, owner_id, category_id) values (?, ?, ?, ?, ?, ?)';
    const [result] = await conn.query(query,[req.body.title, req.body.description, sqlDatetime, null, OwnerId, req.body.categoryId]);
    await conn.release();
    return result;
}


export {getAllPetitions, getById, getByTitle, insert}