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


function fetchWeatherData(query, resp) {
    request.get(
        encodeURI(`https://api.weatherapi.com/v1/current.json?q=${query}&key=${config.WEATHER_API_KEY}`),
        {json: true},
        (apiErr, apiResp, apiRespBody) => {
            if (apiErr) {
                console.warn(apiErr);
                resp.status(500).send("API error occurred!");
                return;
            }

            switch (apiResp.statusCode) {
                case 200:
                    let parsedData = parseWeatherData(apiRespBody);
                    resp.status(200).json(parsedData);
                    break;
                case 400:
                    resp.status(404).send(`Invalid location: ${query}!`);
                    break;
                default:
                    resp.status(500).send("API error occurred!");
            }
        }
    );
}


server.app.get('/weather/city', (req, resp) => {
    if (!req.query.q) {
        resp.status(400).send("Please specify location name");
        return;
    }

    fetchWeatherData(req.query.q, resp);
});

server.app.get('/weather/coordinates', (req, resp) => {
    if (!(req.query.lat && req.query.long)) {
        resp.status(400).send("Please specify both latitude and longitude");
        return;
    }

    let coords = `${req.query.lat},${req.query.long}`;
    fetchWeatherData(coords, resp);
});
