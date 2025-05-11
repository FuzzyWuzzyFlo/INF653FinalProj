const State = require('../model/States');
const statesJson = require('../model/statesData.json');
const jsonMessage = require('../middleware/jsonMessage');
const res = require('express/lib/response');
const getStateName = require('../middleware/getStateName');

const getAllStates = async (req, res) => {
  let mongoStates = await State.find();
  if (!mongoStates) return res.status(204).json({ message: 'No states found.' });

  // Shallow copy
  let jsonStates = [...statesJson];

  // Add Mongo funfacts
  jsonStates.forEach(state => {
      const match = mongoStates.find(dbState => dbState.stateCode === state.code);
      if (match?.funfacts?.length) {
          state.funfacts = match.funfacts;
      }
  });

  const contigParam = req.query.contig?.toLowerCase();

  if (contigParam === 'true') {
      jsonStates = jsonStates.filter(state => state.code !== 'AK' && state.code !== 'HI');
  } else if (contigParam === 'false') {
      jsonStates = jsonStates.filter(state => state.code === 'AK' || state.code === 'HI');
  }

  res.json(jsonStates);
};






// const getState = async (req, res, next) => {
//     if (!req?.params?.state) return res.status(400).json({ 'message': 'State code required.' });
//     const state = await State.findOne({ stateCode: req.params.state.toUpperCase() }).exec();
//     if (!state) {
//         return res.status(400).json({ "message": `Invalid state abbreviation parameter` });
//     }
//     const jsonState = statesJson.find(s => s.code == req.params.state.toUpperCase());
//     if (state.funfacts && state.funfacts.length > 0) { 
//         const funfacts = state.funfacts;
//         jsonState['funfacts'] = funfacts;
//     }    
//     res.json(jsonState);
// }
const getState = async (req, res) => {
  if (!req?.params?.state) {
      return res.status(400).json({ 'message': 'State code required.' });
  }

  const code = req.params.state.toUpperCase();

  // Find in JSON first
  const jsonState = statesJson.find(s => s.code === code);
  if (!jsonState) {
      return res.status(400).json({ 'message': 'Invalid state abbreviation parameter' });
  }

  // Now check MongoDB for funfacts
  const state = await State.findOne({ stateCode: code }).exec();

  if (state?.funfacts?.length > 0) {
      jsonState.funfacts = state.funfacts;
  }

  res.json(jsonState);
};


const getFunfact = async (req, res) => {
  console.log("🔍 Incoming request:", req.params);
  const allStates = await State.find();
  console.log("State codes in DB:", allStates.map(s => s.stateCode));
  
  if (!req?.params?.state) {
      console.log("❌ Missing state param");
      return res.status(400).json({ message: 'State code required.' });
  }

  const code = req.params.state.toUpperCase();
  console.log("🔍 Normalized code:", code);

  const jsonState = statesJson.find(s => s.code === code);
  if (!jsonState) {
      console.log("❌ Invalid state code:", code);
      return res.status(400).json({ message: 'Invalid state abbreviation parameter' });
  }

  let state;
  try {
      state = await State.findOne({ stateCode: code }).exec();
      console.log("📦 Mongo result:", state);
  } catch (err) {
      console.error("❌ MongoDB query failed:", err);
      return res.status(500).json({ message: 'Database error.' });
  }

  if (!state || !Array.isArray(state.funfacts) || state.funfacts.length === 0) {
      console.log("❌ No funfacts found for", code);
      return res.json({ message: `No Fun Facts found for ${jsonState.state}` });
  }

  const randomIndex = Math.floor(Math.random() * state.funfacts.length);
  const selectedFact = state.funfacts[randomIndex];

  console.log("✅ Returning funfact:", selectedFact);

  return res.json({ funfact: selectedFact });
};



const getCapital = async (req, res) => {
    jsonMessage(req, res, 'capital');
}

const getNickname = async (req, res) => {
    jsonMessage(req, res, 'nickname');
}

const getPopulation = async (req, res) => {
    jsonMessage(req, res, 'population');
}

const getAdmission = async (req, res) => {
    jsonMessage(req, res, 'admission');
}





// POST
const createNewFunfacts = async (req, res) => {
  const stateCode = req.params?.state?.toUpperCase();

  if (!stateCode) {
      return res.status(400).json({ message: 'State code required.' });
  }

  // Validate funfacts in request body
  const funfacts = req.body?.funfacts;
  if (!funfacts) {
      return res.status(400).json({ message: 'State fun facts value required' });
  }

  if (!Array.isArray(funfacts)) {
      return res.status(400).json({ message: 'State fun facts value must be an array' });
  }

  let state = await State.findOne({ stateCode }).exec();

  // Create new if not found
  if (!state) {
      state = await State.create({ stateCode, funfacts });
  } else {
      state.funfacts.push(...funfacts);
      await state.save();
  }

  // Return clean JSON response with 2 properties: stateCode and funfacts
  return res.status(201).json({
      stateCode: state.stateCode,
      funfacts: state.funfacts
  });
};


// PATCH
const updateFunfact = async (req, res) => {
  const stateCode = req.params?.state?.toUpperCase();

  if (!stateCode) return res.status(400).json({ message: 'State code required.' });

  const { index, funfact } = req.body;

  if (index === undefined) {
      return res.status(400).json({ message: 'State fun fact index value required' });
  }

  if (!funfact) {
      return res.status(400).json({ message: 'State fun fact value required' });
  }

  const state = await State.findOne({ stateCode }).exec();

  if (!state) {
      return res.status(404).json({ message: `No Fun Facts found for ${getStateName(stateCode)}` });
  }

  if (!state.funfacts || state.funfacts.length === 0) {
      return res.status(404).json({ message: `No Fun Facts found for ${getStateName(stateCode)}` });
  }

  const correctedIndex = index - 1;

  if (correctedIndex < 0 || correctedIndex >= state.funfacts.length) {
      return res.status(400).json({ message: `No Fun Fact found at that index for ${getStateName(stateCode)}` });
  }

  state.funfacts[correctedIndex] = funfact;

  await state.save();

  return res.json({
      stateCode: state.stateCode,
      funfacts: state.funfacts
  });
};


// DELETE
const deleteFunfact = async (req, res) => {
  const stateCode = req.params?.state?.toUpperCase();

  if (!stateCode) return res.status(400).json({ message: 'State code required.' });

  const { index } = req.body;

  if (index === undefined) {
      return res.status(400).json({ message: 'State fun fact index value required' });
  }

  const state = await State.findOne({ stateCode }).exec();

  if (!state || !state.funfacts || state.funfacts.length === 0) {
      return res.status(404).json({ message: `No Fun Facts found for ${getStateName(stateCode)}` });
  }

  const correctedIndex = index - 1;

  if (correctedIndex < 0 || correctedIndex >= state.funfacts.length) {
      return res.status(400).json({ message: `No Fun Fact found at that index for ${getStateName(stateCode)}` });
  }

  state.funfacts.splice(correctedIndex, 1);
  await state.save();

  return res.json({
      stateCode: state.stateCode,
      funfacts: state.funfacts
  });
};






module.exports = { 
    getAllStates,
    getState,
    getCapital,
    getNickname,
    getPopulation,
    getAdmission,
    getFunfact,

    createNewFunfacts,
    updateFunfact,
    deleteFunfact
};