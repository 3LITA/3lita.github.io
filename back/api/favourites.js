var server = require('../server');


server.app.get('/favourites', (req, res) => {
    server.db.all('SELECT name FROM favourites', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send("Database error");
            return;
        }

        res.json(rows);
    })
});

server.app.post('/favourites', (req, res) => {
    if (!req.body.name) {
        res.status(400).send("Please specify location name");
        return;
    }

    let statement = server.db.prepare('INSERT INTO favourites VALUES (?)');

    statement.run(req.body.name, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.status(200).json({'status': 'ok'});
    });
});

server.app.delete('/favourites', (req, res) => {
    if (!req.query.name) {
        res.status(400).send("Please specify location name");
        return;
    }

    let statement = server.db.prepare('DELETE FROM favourites WHERE name=?');

    statement.run(req.query.name, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.status(200).json({'status': 'ok'});
    });
});
