type User = {
    /**
    * User id as defined by the database
    */
    id: number,
    /**
    *Users username as entered when created
    */

    email: string,
    first_name: string,
    last_name: string,
    password: string,
    image_filename: string,
    auth_token: string

}