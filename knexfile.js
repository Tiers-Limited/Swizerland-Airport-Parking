// Knex configuration file for running migrations via CLI
require('dotenv').config();
require('ts-node/register');

module.exports = require('./src/config/database').default;
