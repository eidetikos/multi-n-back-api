import Game from '../models/game';
import User from '../models/user';
import ensureAuth from '../utils/ensure-auth';
import express from 'express';

const router = express.Router()
    .post('/', ensureAuth, (req, res, next) => {
        Game.create(modifyData(req.body))
            .then(game => {
                return User.findByIdAndUpdate(
                    req.user.id, 
                    { $push: { gameLog: game._id } }, 
                    { new: true }
                )
                    .select('-hash')
                    .then(user => res.send({ game, user }));
            })
            .catch(next);
    })
    .get('/all', (req, res, next) => {
        Game.find()
            .then(games => res.send(games))
            .catch(next);
    })
    .get('/users', ensureAuth, (req, res, next) => {
        User.findById(req.user.id)
            .populate('gameLog')
            .select('gameLog')
            .lean()
            .then(user => res.send(user.gameLog))
            .catch(next);
    });

export default router;


// Helper function: 
// changes difficulty prop to display corresponding string instead of object
// Calculates avgN and highestN back, and sets their prop with the new calculated data
function modifyData(game) {

    if(game.sequences.length === 1) return { 
        ...game,
        avgN: 0,
        highN: 0
    };

    const avgN = Math.floor(game.sequences.slice(0, -1).reduce((a,b) => a + b.nBack, 0) / (game.sequences.length - 1) *100) / 100;
    const highN = game.sequences.slice(0, -1).sort((a,b) => b.nBack - a.nBack)[0].nBack;

    return { ...game, avgN, highN };
}