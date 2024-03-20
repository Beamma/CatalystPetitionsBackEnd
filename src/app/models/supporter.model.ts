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

const getByTierId = async (id: string) => {
    Logger.info(`Getting Supporter Tier by Petition Id ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM supporter WHERE support_tier_id = (?)';
    const [result] = await conn.query(query,[id]);
    await conn.release();
    return result;
}


export {getByPetitionId, getByTierId}