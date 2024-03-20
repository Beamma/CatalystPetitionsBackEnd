import {Request, Response} from "express";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import { getPool } from '../../config/db';

const insert = async (row: any, id: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding supporter tier to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into support_tier (petition_id, title, description, cost) values (?, ?, ?, ?)';
    const [result] = await conn.query(query,[id, row.title, row.description, row.cost]);
    await conn.release();
    return result;
}

const getByPetitionId = async (id: string): Promise<Tier[]> => {
    Logger.info(`Getting Supporter Tier by Petition Id ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT title, description, cost, id as supportTierId FROM support_tier WHERE petition_id = (?) ORDER BY supportTierId ASC';
    const [result] = await conn.query(query,[id]);
    await conn.release();
    return result;
}


export {insert, getByPetitionId}