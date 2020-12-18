let fs = require('fs');
let path = require('path');

let chai = require('chai');
let chaiAsPromised = require('chai-as-promised');
let fetchMock = require('fetch-mock');
let jsdom = require('jsdom');


chai.use(chaiAsPromised);
const htmlContent = fs.readFileSync(path.resolve(__dirname, '../../src/frontend/index.html'));
const weatherDataSamara = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/samara_weather_response.json')));
const weatherDataLondon = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../data/london_weather_response.json')));


class MockGeolocationPosition {
    constructor(latitude, longitude) {
        this.coords = {
            latitude: latitude,
            longitude: longitude
        };
    }
}

mockNavigator = {
    geolocation: {
        getCurrentPosition: (successCallback, _) => {
            let location = new MockGeolocationPosition(60.18, 24.93);
            successCallback(location).then(() => {});
        }
    }
}

describe('Frontend Tests', () => {
    const favouritesUrl = /http\:\/\/localhost\:3000\/favourites.*/;
    let main = null;

    beforeEach(() => {
        let dom = new jsdom.JSDOM(htmlContent, {
            contentType: "text/html",
            includeNodeLocations: true
        });

        global.window = dom.window;
        global.document = dom.window.document;
        global.GeolocationPosition = MockGeolocationPosition;
        global.navigator = mockNavigator;

        main = require('../../src/frontend/js/main');
        document.removeEventListener("DOMContentLoaded", main.initPage);

        fetchMock.get(
            /http\:\/\/localhost\:3000\/weather\/city\?q=(S|s)amara/,
            weatherDataSamara
        );

        fetchMock.get(
            'http://localhost:3000/weather/coordinates?lat=60.18&long=24.93',
            weatherDataLondon
        );

        fetchMock.get(
            /http\:\/\/localhost\:3000\/weather\/city\?q=(L|l)ondon/,
            weatherDataLondon
        );
    });

    describe('Current Location', () => {
        it('should init current location', async () => {
            main.initCurrentLocation()

            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('.main-location-info h2');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('London');
        });

        it('should load current location by coordinates', async () => {
            let coords = new MockGeolocationPosition(60.18, 24.93);

            await main.loadCurrentLocation(coords);
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('.main-location-info h2');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('London');
        });

        it('should load current location by name', async () => {
            await main.loadCurrentLocation('samara');
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('.main-location-info h2');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('Samara');
        });

        it('should use default location in case geolocation sharing denied', async () => {
            let err = { code: 1, message: '' };

            await main.loadDefaultLocation(err);
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('.main-location-info h2');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('Samara');
        });
    });

    describe('Favourite Locations', () => {
        beforeEach(() => {
            let mockEvent = {
                preventDefault: () => {},
                target: {
                    elements: {
                        favouriteLocation: {
                            value: "samara"
                        }
                    }
                }
            };

            global.event = mockEvent;

            fetchMock.post(
                favouritesUrl,
                {}
            );

            fetchMock.delete(
                favouritesUrl,
                {}
            );
        });

        it('should add new favourite location', async () => {
            let event = {
                preventDefault: () => {},
                target: {
                    elements: {
                        favouriteLocation: {
                            value: "samara"
                        }
                    }
                }
            };

            await main.addFavouriteLocation(event);
            await new Promise(r => setTimeout(r, 10));

            let favouriteLocation = document.querySelector('li[id="samara"]');
            chai.expect(favouriteLocation).to.not.be.null;
        });

        it('should alert on empty value', (done) => {
            let event = {
                preventDefault: () => {},
                target: {
                    elements: {
                        favouriteLocation: {
                            value: ""
                        }
                    }
                }
            };

            global.window.alert = (message) => {
                chai.expect(message).to.be.equal("Необходимо ввести название локации");
                done();
            };

            main.addFavouriteLocation(event).then(() => {});
        });

        it('should alert on duplicate favourite location', (done) => {
            let event = {
                preventDefault: () => {},
                target: {
                    elements: {
                        favouriteLocation: {
                            value: "samara"
                        }
                    }
                }
            };

            global.window.alert = (message) => {
                chai.expect(message).to.be.equal('Необходимо ввести название локации');
                done();
            };

            main.addFavouriteLocation(event).then(() => {});
            main.addFavouriteLocation(event).then(() => {});
        });

        it('should init bookmarks', (done) => {
            main.savedLocations.add('samara');
            main.savedLocations.add('london');
            main.initSavedLocations();

            setTimeout(() => {
                let bookmark = document.querySelector('li[id="samara"]');
                chai.expect(bookmark).to.not.be.null;
                bookmark = document.querySelector('li[id="london"]');
                chai.expect(bookmark).to.not.be.null;

                done();
            }, 10);
        });

        afterEach(() => {
            global.event = undefined;
        });
    });

    describe('Removing favourite location', () => {
        beforeEach(() => {
            fetchMock.get(
                favouritesUrl,
                [{ name: 'samara' }, { name: 'london' }]
            );
        });

        it('should remove the saved location', async () => {
            await main.initPage();
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('.main-location-info h2');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('London');

            let favouriteLocation = document.querySelector('li[id="samara"]');
            chai.expect(favouriteLocation).to.not.be.null;

            chai.expect(main.savedLocations).to.contain('london');
            let removeBtn = favouriteLocation.querySelector(".remove-btn");

            chai.expect(removeBtn).to.not.be.null;
            removeBtn.click();

            await new Promise(r => setTimeout(r, 10));
            chai.expect(main.savedLocations).to.contain('london');

        });
    });

    describe('Page Initialization', () => {
        beforeEach(() => {
            fetchMock.get(
                favouritesUrl,
                [{ name: 'samara' }, { name: 'london' }]
            );
        });

        it('should initialize the page with saved locations', async () => {
            await main.initPage();
            await new Promise(r => setTimeout(r, 10));

            let here = document.querySelector('.main-location-info h2');
            chai.expect(here).to.not.be.null;
            chai.expect(here.textContent).to.be.equal('London');

            let favouriteLocation = document.querySelector('li[id="samara"]');
            chai.expect(favouriteLocation).to.not.be.null;
            favouriteLocation = document.querySelector('li[id="london"]');
            chai.expect(favouriteLocation).to.not.be.null;
        });
    });

    afterEach(() => {
        global.window = undefined;
        global.document = undefined;
        global.GeolocationPosition = undefined;
        global.navigator = undefined;

        main = null;

        fetchMock.restore();
    });
});
