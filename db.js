/** Database setup for BizTime. */

const { Client } = require("pg");

let DB_URI;

if (process.env.NODE_ENV === "test") {
  DB_URI = "postgresql:///biztime_test";
} else {
  DB_URI = "postgresql:///biztime";
}

// console.log("DB: ", DB_URI);

let db = new Client({ connectionString: DB_URI });

db.password = "postgres";

// console.log(db);

db.connect();

module.exports = db;
