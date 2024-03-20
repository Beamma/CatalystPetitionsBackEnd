import {Request, Response} from "express";
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';
import { getPool } from '../../config/db';

const getAll = async () => {
    Logger.info(`Getting all categories from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM category';
    const [result] = await conn.query(query);
    await conn.release();
    return result;
}

const getById = async (id: string) => {
    Logger.info(`Getting category ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM category WHERE id = (?)';
    const [result] = await conn.query(query, [id]);
    await conn.release();
    return result;
}

export {getAll, getById}