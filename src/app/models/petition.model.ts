import {Request, Response} from "express";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import { getPool } from '../../config/db';

const getAllPetitions = async (req: Request) => {
    const startIndex = req.query.startIndex;
    const count = req.query.count;
    const sortBy = req.query.sortBy;

    const q = req.query.q;
    const categoryIds = req.query.categoryIds;
    const supportingCost = req.query.supportingCost;
    const ownerId = req.query.ownerId;
    const supporterId = req.query.supporterId;

    let where = false;

    let query = "SELECT * FROM petition"

    if (q !== null) {
        if (where === false) {
            where = true;
            query += " WHERE lower(title) LIKE '%" + q +"%' AND lower(description) LIKE '%" + q +"%'";
        } else {
            query += " AND lower(title) LIKE '%" + q + "%' AND lower(description) LIKE '%" + q +"%'";
        }
    }

    Logger.info(query);
    const conn = await getPool().getConnection();
    const [result] = await conn.query(query);
    await conn.release();
    return result;
}

export {getAllPetitions}