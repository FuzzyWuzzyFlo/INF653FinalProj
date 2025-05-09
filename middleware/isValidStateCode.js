// const statesJson = require('../model/statesData.json');

// const isValidStateCode = (req) => {
//     if (!req.params?.state) return res.status(400).json({ 'message': 'State code required.' });
//     const stateCode = statesJson.map(state => state.code); // array of state codes
//     const upcaseState = req.params.state.toUpperCase(); // user requested state
//     return (stateCode.includes(upcaseState));
// }


// module.exports = isValidStateCode;

const statesJson = require('../model/statesData.json');

const isValidStateCode = (req, res, next) => {
    const stateParam = req.params?.state;
    if (!stateParam) {
        return res.status(400).json({ message: 'State code required.' });
    }

    const requestedCode = stateParam.toUpperCase(); // Normalize
    const validCodes = statesJson.map(s => s.code.toUpperCase());

    if (!validCodes.includes(requestedCode)) {
        console.log('Invalid code:', requestedCode);
        return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
    }

    next(); // Move to the next middleware/controller
};

module.exports = isValidStateCode;

