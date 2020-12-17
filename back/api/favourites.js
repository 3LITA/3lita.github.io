var request = require('request');

var server = require('../server');


// function checkLocationExists(locationName) {
//     request.get(
//         encodeURI(`https://api.weatherapi.com/v1/current.json?q=${locationName}&key=${config.WEATHER_API_KEY}`),
//         {json: true},
//         (apiErr, apiResp, apiRespBody) => {
//             switch (apiResp.statusCode) {
//                 case 200:
//                     return true;
//                 default:
//                     return false;
//             }
//         }
//     );
// }


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

server.app.post('/favourites', (req, res) => {
    console.info(`New POST request on /favourites: name=${req.body.name}`)
    if (!req.body.name) {
        res.status(400).send("Please specify location name");
        return;
    }
    // if (!checkLocationExists(req.body.name)) {
    //     res.status(404).send("Location not found");
    //     return;
    // }

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

server.app.delete('/favourites/:name', (req, res) => {
    console.info(`New DELETE request on /favourites, name=${req.params.name}`)
    if (!req.params.name) {
        res.status(400).send("Please specify location name");
        return;
    }

    let statement = server.db.prepare('DELETE FROM favourites WHERE name=?');

    statement.run(req.params.name, (err) => {
        if (err) {
            console.error(err);
            res.status(500).send("Database error");
            return;
        }

        res.status(200).json({'status': 'ok'});
    });
});
