'use strict';
// Vercel function entry — delegate to the compiled serverless handler in dist
const mod = require('../dist/serverless');
module.exports = mod.default || mod.handler || mod;
