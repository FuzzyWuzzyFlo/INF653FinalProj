const statesJson = require('../model/statesData.json');

const isValidStateCode = (req) => {
    if (!req.params?.state) return res.status(400).json({ 'message': 'State code required.' });
    const stateCode = statesJson.map(state => state.code); // array of state codes
    const upcaseState = req.params.state.toUpperCase(); // user requested state
    return (stateCode.includes(upcaseState));
}


module.exports = isValidStateCode;