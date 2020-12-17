let request = require('request');

let server = require('../server');
let config = require('../config');


function parseWeatherData(data) {
    return {
        'name': data.location.name,
        'icon': `https:${data.current.condition.icon.replace("64x64", "128x128")}`,
        'temperature': `${data.current.temp_c}°C`,
        'details': {
            'wind': `${data.current.wind_kph} kph ${data.current.wind_dir}`,
            'clouds': data.current.condition.text,
            'pressure': `${data.current.pressure_mb} mb`,
            'humidity': `${data.current.humidity}%`,
            'coords': `[${data.location.lat}, ${data.location.lon}]`
        }
    }
}


function fetchWeatherData(query, res) {
    request.get(
        encodeURI(`https://api.weatherapi.com/v1/current.json?q=${query}&key=${config.WEATHER_API_KEY}`),
        {json: true},
        (apiErr, apiResp, apiRespBody) => {
            if (apiErr) {
                console.warn(apiErr);
                res.status(500).send("API error occurred!");
                return;
            }

            switch (apiResp.statusCode) {
                case 200:
                    let parsedData = parseWeatherData(apiRespBody);
                    res.status(200).json(parsedData);
                    break;
                case 400:
                    res.status(404).send(`Invalid location: ${query}!`);
                    break;
                default:
                    res.status(500).send("API error occurred!");
            }
        }
    );
}


server.app.get('/weather/city', (req, res) => {
    if (!req.query.q) {
        res.status(400).send("Please specify location name");
        return;
    }

    fetchWeatherData(req.query.q, res);
});

server.app.get('/weather/coordinates', (req, res) => {
    if (!(req.query.lat && req.query.long)) {
        res.status(400).send("Please specify both latitude and longitude");
        return;
    }

    let coords = `${req.query.lat},${req.query.long}`;
    fetchWeatherData(coords, res);
});
