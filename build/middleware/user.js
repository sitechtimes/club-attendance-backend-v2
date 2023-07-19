"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUser = void 0;
const createUser = (req, res, next) => {
    //check spreadsheet for user email, if it doesn't exist, create a new row with the user's email and a new uuid
    //if it does exist, return the uuid associated with the email
    //return the uuid to the client
    res.json({ message: 'User created!' });
};
exports.createUser = createUser;
