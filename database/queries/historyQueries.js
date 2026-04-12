/**
 * database/queries/historyQueries.js
 * SQL query helpers for fill_history table.
 */

const INSERT_FILL = `
  INSERT INTO fill_history (bin_id, fill_pct, priority)
  VALUES ($1, $2, $3)`;

const LATEST_FILL_PER_BIN = `
  SELECT DISTINCT ON (bin_id)
    bin_id, fill_pct, priority, recorded_at
  FROM fill_history
  ORDER BY bin_id, recorded_at DESC`;

const HISTORY_FOR_BIN = `
  SELECT fill_pct, priority, recorded_at
  FROM   fill_history
  WHERE  bin_id = $1
  ORDER  BY recorded_at DESC
  LIMIT  50`;

module.exports = { INSERT_FILL, LATEST_FILL_PER_BIN, HISTORY_FOR_BIN };
