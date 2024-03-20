type Supporter = {
    /**
    * User id as defined by the database
    */
    id: number,
    /**
    *Users username as entered when created
    */
    petition_id: number,
    supporter_tier_id: number,
    user_id: number,
    message: string,
    timestamp: Date

}