type Petition = {
    /**
    * User id as defined by the database
    */
    id: number,
    /**
    *Users username as entered when created
    */

    title: string,
    description: string,
    creation_date: Date,
    image_filename: string,
    owner_id: number,
    category_id: number

}