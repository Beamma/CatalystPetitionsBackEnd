type Petition = {
    /**
    * User id as defined by the database
    */
    id: number,
    title: string,
    description: string,
    creation_date: Date,
    image_filename: string,
    owner_id: number,
    category_id: number,
    numberOfSupporters: any,
    supportTiers: Array<Tier>,
    moneyRaised: any

}