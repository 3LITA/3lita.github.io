let fetch = require('node-fetch');

let server = require('../server');
let config = require('../config');


function checkLocationExists(locationName) {
    return fetch(`https://api.weatherapi.com/v1/current.json?q=${locationName}&key=${config.WEATHER_API_KEY}`).then(
        resp => {
            console.info(`Location "${locationName}" found: ${resp.ok}, status: ${resp.status}`);
            return resp.ok;
        }
    )
}


server.app.get('/favourites', (req, res) => {
    console.info(`New GET request on /favourites`)
    server.db.all('SELECT name FROM favourites', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).set('Access-Control-Allow-Origin', "*").send("Database error");
            return;
        }

        res.json(rows);
    })
});

server.app.post('/favourites', async (req, res) => {
    console.info(`New POST request on /favourites: name=${req.body.name}`)
    if (!req.body.name) {
        res.status(400).send("Please specify location name");
        return;
    }

    console.log(`Checking if location "${req.body.name}" exists`)

    const locationExists = await checkLocationExists(req.body.name)
    if (!locationExists) {
        console.warn(`Location "${req.body.name}" not found`)
        res.status(404).send("Location not found");
        return;
    }

    let statement = server.db.prepare("INSERT INTO favourites VALUES (?)");

    statement.run(req.body.name, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.status(200).json({'status': 'ok'});
    });
});

server.app.delete('/favourites/:name', (req, res) => {
    console.info(`New DELETE request on /favourites, name=${req.params.name}`)
    if (!req.params.name) {
        res.status(400).send("Please specify location name");
        return;
    }

    let statement = server.db.prepare("DELETE FROM favourites WHERE name=?");

    statement.run(req.params.name, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.status(200).json({'status': 'ok'});
    });
});
