import bcrypt from "bcrypt";

const hash = async (password: string): Promise<string> => {
    const salt = bcrypt.genSaltSync(10);
    return bcrypt.hashSync(password, salt);
}

const compare = async (password: string, comp: string): Promise<boolean> => {
    return await bcrypt.compare(password, comp);
}

export {hash, compare}