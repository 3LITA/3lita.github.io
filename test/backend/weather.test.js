let server = require('../../src/backend/server')
require('../../src/backend/api/weather');

let chai = require('chai');
let chaiHttp = require('chai-http');
let fs = require('fs');
let path = require('path');
let rewire = require('rewire');

let weatherModule = rewire('../../src/backend/api/weather');
let parseWeatherData = weatherModule.__get__('parseWeatherData');


chai.use(chaiHttp);

describe('Weather API', () => {
    describe('Parse Weather Data', () => {
        it('should correctly parse weather data', () => {
            let weatherData = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/weather_data.json')));
            let parsedData = parseWeatherData(weatherData);

            chai.expect(parsedData.name).to.be.equal('Samara');
            chai.expect(parsedData.icon).to.be.equal('https://cdn.weatherapi.com/weather/128x128/night/326.png');
            chai.expect(parsedData.temperature).to.be.equal('-7.1°C');

            chai.expect(parsedData.details.wind).to.be.equal('13.7 kph WSW');
            chai.expect(parsedData.details.clouds).to.be.equal('Light snow');
            chai.expect(parsedData.details.pressure).to.be.equal('1018 mb');
            chai.expect(parsedData.details.humidity).to.be.equal('95%');
            chai.expect(parsedData.details.coords).to.be.equal('[53.18, 50.12]');
        })
    });

    describe('GET /weather/city', () => {
        it('should correctly fetch weather data', async () => {
            let resp = await chai
                .request(server.app)
                .get('/weather/city?q=Samara');

            chai.expect(resp.status).to.equal(200);
            chai.expect(resp.body.name).to.equal('Samara');
        });

        it('should fetch empty location name and get 400', async () => {
            let resp = await chai
                .request(server.app)
                .get('/weather/city');

            chai.expect(resp.status).to.equal(400);
            chai.expect(resp.text).to.equal("Please specify location name");
        });

        it('should fetch unknown location name and get 404', async () => {
            let resp = await chai
                .request(server.app)
                .get('/weather/city?q=1')

            chai.expect(resp.status).to.equal(404);
            chai.expect(resp.text).to.equal("Invalid location: 1!");
        });

        // TODO: add test for 500
    });

    describe('GET /weather/coordinates', () => {
        it('should correctly fetch weather data by coordinates', async () => {
            let resp = await chai
                .request(server.app)
                .get('/weather/coordinates?lat=53.18&long=50.12');

            chai.expect(resp.status).to.equal(200);
            chai.expect(resp.body.name).to.equal('Samara');
        });

        it('should fetch weather data without coordinates and get 400', async () => {
            let resp = await chai
                .request(server.app)
                .get('/weather/coordinates');

            chai.expect(resp.status).to.equal(400);
            chai.expect(resp.text).to.equal("Please specify both latitude and longitude");
        });

        it('should fetch weather data without longitude and get 400', async () => {
            let resp = await chai
                .request(server.app)
                .get('/weather/coordinates?lat=53.18');

            chai.expect(resp.status).to.equal(400);
            chai.expect(resp.text).to.equal("Please specify both latitude and longitude");
        });

        it('should fetch weather data without latitude and get 400', async () => {
            let resp = await chai
                .request(server.app)
                .get('/weather/coordinates?long=50.12');

            chai.expect(resp.status).to.equal(400);
            chai.expect(resp.text).to.equal("Please specify both latitude and longitude");
        });
    });
});
