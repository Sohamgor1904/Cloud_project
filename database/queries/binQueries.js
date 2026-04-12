/**
 * database/queries/binQueries.js
 * SQL query helpers for bins and latest fill view.
 */

const GET_ALL_BINS  = `SELECT * FROM latest_bin_fills ORDER BY id`;

const GET_BIN_BY_ID = `SELECT * FROM latest_bin_fills WHERE id = $1`;

module.exports = { GET_ALL_BINS, GET_BIN_BY_ID };
