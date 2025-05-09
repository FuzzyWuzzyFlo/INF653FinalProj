const express = require('express');
const router = express.Router();
const statesController = require('../../controllers/statesController');
const verifyState = require('../../middleware/isValidStateCode'); // Make sure this path is correct

// GET /states/
router.route('/')
    .get(statesController.getAllStates);

// GET /states/:state (must validate the :state param)
router.route('/:state')
    .get(verifyState, statesController.getState);

// Fun Fact routes with validation
router.route('/:state/funfact')
    .get(verifyState, statesController.getFunfact)
    .post(verifyState, statesController.createNewFunfacts)
    .patch(verifyState, statesController.updateFunfact)
    .delete(verifyState, statesController.deleteFunfact);

// Capital
router.route('/:state/capital')
    .get(verifyState, statesController.getCapital);

// Nickname
router.route('/:state/nickname')
    .get(verifyState, statesController.getNickname);

// Population
router.route('/:state/population')
    .get(verifyState, statesController.getPopulation);

// Admission
router.route('/:state/admission')
    .get(verifyState, statesController.getAdmission);

module.exports = router;
