import express from 'express';
import { auth, oauth2callback } from '../middleware/auth';
const router = express.Router();

router.get('/', (req, res) => {
    res.send('Hello World!');
});

router.get('/oauth2', auth)
router.get('/oauth2callback', oauth2callback)

export { router };