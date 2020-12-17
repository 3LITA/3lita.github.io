const cors = require('cors')
const express = require('express')
const sqlite3 = require('sqlite3')

const config = require('./config')


let app = express();
app.use(express.static('../front'));
app.use(express.json());
app.use(cors());

let db = new sqlite3.Database(config.DB_SOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    }

    console.info(`Established SQLite connection to ${config.DB_SOURCE}`);
    db.run(`
        CREATE TABLE IF NOT EXISTS favourites(
            name TEXT PRIMARY KEY
        );
    `);
})

exports.db = db;
exports.app = app;
