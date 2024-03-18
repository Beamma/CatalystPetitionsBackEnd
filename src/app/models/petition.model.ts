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
            whereString += "WHERE lower(petition.title) LIKE '%" + q +"%' OR lower(petition.description) LIKE '%" + q +"%'";
        } else {
            whereString += " AND lower(petition.title) LIKE '%" + q + "%' OR lower(petition.description) LIKE '%" + q +"%'";
        }
    }

    const order = "ORDER BY creationDate ASC"

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

export {getAllPetitions}