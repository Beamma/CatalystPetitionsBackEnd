import {Request, Response} from "express";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import { getPool } from '../../config/db';

const getByPetitionId = async (id: string) => {
    Logger.info(`Getting Supporter Tier by Petition Id ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM supporter WHERE petition_id = (?)';
    const [result] = await conn.query(query,[id]);
    await conn.release();
    return result;
}

const getByPetitionIdReversed = async (id: string) => {
    Logger.info(`Getting Supporter by Petition Id ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = `
    SELECT supporter.id as supportId, supporter.support_tier_id as supportTierId, supporter.message, supporter.user_id as supporterId, user.first_name as supporterFirstName, user.last_name as supporterLastName, supporter.timestamp
    FROM supporter
    INNER JOIN user ON supporter.user_id = user.id
    WHERE supporter.petition_id = (?) ORDER BY timestamp DESC, supportId DESC`;
    const [result] = await conn.query(query,[id]);
    await conn.release();
    return result;
}

const getByTierId = async (id: string) => {
    Logger.info(`Getting Supporter Tier by Petition Id ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM supporter WHERE support_tier_id = (?)';
    const [result] = await conn.query(query,[id]);
    await conn.release();
    return result;
}


export {getByPetitionId, getByTierId, getByPetitionIdReversed}