import { readFile, writeFile, unlink } from 'mz/fs';
import { getPool } from '../../config/db';
import Logger from '../../config/logger';
import { ResultSetHeader } from 'mysql2';

// const getAll = async (): Promise<User[]> => {
//     Logger.info(`Getting all users from the database`);
//     const conn = await getPool().getConnection();
//     const query = 'select * from lab2_users';
//     const [ rows ] = await conn.query( query );
//     await conn.release();
//     return rows;
// }

// const getOne = async (id: number): Promise<User[]> => {
//     Logger.info(`Getting user ${id} from the database`);
//     const conn = await getPool().getConnection();
//     const query = 'select * from lab2_users where user_id = ?';
//     const [ rows ] = await conn.query( query, [ id ] );
//     await conn.release();
//     return rows;
// }


const insert = async (email: string, firstName: string, lastName: string, password: string): Promise<ResultSetHeader> => {
    Logger.info(`Adding user ${email} to the database`);
    const conn = await getPool().getConnection();
    const query = 'insert into user (email, first_name, last_name, password) values (?, ?, ?, ?)';
    const [result] = await conn.query(query,[email, firstName, lastName, password]);
    await conn.release();
    return result;
}

const getByEmail = async (email: string): Promise<User[]> => {
    Logger.info(`Getting user ${email} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE email = (?)';
    const [result] = await conn.query(query,[email]);
    await conn.release();
    return result;
}

const insertToken = async (email: string, token: string): Promise<any> => {
    Logger.info(`Updating user ${email} token in the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = (?) WHERE email = (?)';
    const [result] = await conn.query(query,[token, email]);
    await conn.release();
    return result;
}

const getId = async (id: string): Promise<User[]> => {
    Logger.info(`Getting user ${id} from the database`);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE id = (?)';
    const [result] = await conn.query(query,[id]);
    await conn.release();
    return result;
}

const getImage = async (imagePath: string): Promise<Buffer> => {
    const image = readFile(imagePath);
    return image;
}

const uploadImage  = async (imageDir: string, image: Buffer, imageName: string, id: string) => {
    Logger.info(`Uploading photo for user ${id}`);
    writeFile(imageDir, image);

    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET image_filename = (?) WHERE id = (?)';
    const [result] = await conn.query(query,[imageName, id]);
    await conn.release();
    return result;

}

const removeImage = async (imageDir: string, id: string) => {

    Logger.info(`Updating user ${id} remove image from database`);
    unlink(imageDir);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET image_filename = (?) WHERE id = (?)';
    const [result] = await conn.query(query,[null, id]);
    await conn.release();
    return result;
}

// const getByToken = async (token: string): Promise<User[]> => {
//     Logger.info(`Getting user by token ${token} from the database`);
//     const conn = await getPool().getConnection();
//     const query = 'select * from lab2_users where  auth_token = ?';
//     const [ rows ] = await conn.query( query, [ token ] );
//     await conn.release();
//     return rows;
// }

const alterUser = async (id: string, email: string, firstName: string, lastName: string, password: string): Promise<any> => {
    Logger.info(`Updating user ${id} to the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET email = (?), first_name = (?), last_name = (?), password = (?) WHERE id = (?)';
    const [result] = await conn.query(query,[email, firstName, lastName, password, id]);
    await conn.release();
    return result;
}

const removeToken = async (token: string) => {
    Logger.info(`Updating user ${token} token in the database`);
    const conn = await getPool().getConnection();
    const query = 'UPDATE user SET auth_token = (?) WHERE auth_token = (?)';
    const [result] = await conn.query(query,[null, token]);
    await conn.release();
    return result;
}

const getByToken = async (token: string) => {
    Logger.info(`Getting user ${token} from the database`);
    Logger.info(token);
    const conn = await getPool().getConnection();
    const query = 'SELECT * FROM user WHERE auth_token = (?)';
    const [result] = await conn.query(query,[token]);
    await conn.release();
    return result;
}
// const remove = async (id: number): Promise<any> => {
//     Logger.info(`Deleting user ${id} from the database`);
//     const conn = await getPool().getConnection();
//     const query = 'DELETE FROM lab2_users WHERE user_id = (?)';
//     const [result] = await conn.query(query,[id]);
//     await conn.release();
//     return result;
// }

export {insert, getByEmail, insertToken, getId, alterUser, removeToken, getByToken, getImage, uploadImage, removeImage}