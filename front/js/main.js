import { BACKEND_URL, DEFAULT_LOCATION } from './config.js'


const PRIMARY_LOCATION_TEMPLATE = "#currentLocationTemplate";
const SECONDARY_LOCATION_TEMPLATE = "#savedLocationTemplate";

let locationMap = new Map();
let savedLocations = new Set();


function generateLocationId(src) {
    return src.replace(" ", "").toLowerCase();
}


class WeatherError extends Error {
    constructor(message) {
        super(message);
        this.name = "WeatherError";
    }
}


class Location {
    constructor(templateId, locationNameOrCoords, customId = null, searchByCoords = false) {
        this.templateId = templateId;
        this.locationNameOrCoords = locationNameOrCoords;
        this.customId = customId;
        this.searchByCoords = searchByCoords;

        this.weatherData = null;
    }

    async fetchWeather() {
        let resp;
        try {
            if (this.searchByCoords) {
                resp = await fetch(`${BACKEND_URL}/weather/coordinates?lat=${this.locationNameOrCoords.lat}&long=${this.locationNameOrCoords.long}`);
            } else {
                resp = await fetch(`${BACKEND_URL}/weather/city?q=${this.locationNameOrCoords}`);
            }
        } catch (e) {
            console.log("Unexpected error occurred", e)
            return;
        }

        switch (resp.status) {
            case 200:
                this.weatherData = await resp.json();
                return false;
            case 404:
                window.alert(`Локация не найдена!`)
                await this.delete();
                return true;
        }

        throw new WeatherError(await resp.text());
    }

    build() {
        if (this.weatherData) {
            return this.fillData()
        } else {
            return this.load();
        } 
    }

    fillData() {
        let weatherTemplate = document.querySelector(this.templateId).content;

        weatherTemplate.querySelector('*[name="location"]').textContent = this.weatherData.name;
        weatherTemplate.querySelector('img[name="icon"]').src = this.weatherData.icon;
        weatherTemplate.querySelector('span[name="temperature"]').textContent = this.weatherData.temperature;

        weatherTemplate.querySelector('li[name="wind"] span:nth-child(2)').textContent = this.weatherData.details.wind;
        weatherTemplate.querySelector('li[name="clouds"] span:nth-child(2)').textContent = this.weatherData.details.clouds;
        weatherTemplate.querySelector('li[name="pressure"] span:nth-child(2)').textContent = this.weatherData.details.pressure;
        weatherTemplate.querySelector('li[name="humidity"] span:nth-child(2)').textContent = this.weatherData.details.humidity;
        weatherTemplate.querySelector('li[name="coordinates"] span:nth-child(2)').textContent = this.weatherData.details.coords;

        weatherTemplate.querySelector('*[name="container"]').id = this.locationId;

        let clone = document.importNode(weatherTemplate, true);
        let remove_btn = clone.querySelector(".remove-btn");
        if (remove_btn) {
            var item = this;
            remove_btn.addEventListener("click", function () {
                item.delete();
            }, false);
        }

        return clone;
    }

    load() {
        let loader = document.querySelector(`${this.templateId}Loader`).content;

        let rawLocationId = this.customId ? this.customId : this.locationNameOrCoords;
        this.locationId = generateLocationId(rawLocationId);
        loader.querySelector('*[name="container"]').id = this.locationId;

        this.fetchWeather()
            .then(() => {
                let newData = this.fillData();
                let oldData = document.querySelector(`#${this.locationId}`);
                oldData.parentNode.replaceChild(newData, oldData);
            })
            .catch(async (e) => {
                if (e instanceof WeatherError) {
                    console.log(e)
                    alert(e);
                    await this.delete();
                    return;
                }
                console.log(e);
            });

        return document.importNode(loader, true);
    }

    async delete() {
        await fetch(`${BACKEND_URL}/favourites/${this.locationId}`, {method: 'DELETE'}).then(() => {});

        locationMap.delete(this.locationId);
        savedLocations.delete(this.locationId);

        rebuildLocationList();
    }
}


function initCurrentLocation() {
    let wrapNode = document.querySelector(".block-main");
    wrapNode.textContent = "";
    wrapNode.appendChild(getCurrentLocationLoader());
    navigator.geolocation.getCurrentPosition(loadCurrentLocation, loadDefaultLocation);
}


async function loadCurrentLocation(location) {
    let searchByCoords;
    if (location instanceof GeolocationPosition) {
        location = {
            'lat': location.coords.latitude,
            'long': location.coords.longitude
        };
        searchByCoords = true;
    }
    else {
        searchByCoords = false;
    }

    let primaryWeatherItem = new Location(PRIMARY_LOCATION_TEMPLATE, location, "_here", searchByCoords);
    let primaryWeather = primaryWeatherItem.build();

    let wrapNode = document.querySelector(".block-main");
    wrapNode.textContent = "";
    wrapNode.appendChild(primaryWeather);
}


async function loadDefaultLocation(error) {
    console.log(error)
    await loadCurrentLocation(DEFAULT_LOCATION);
}


async function addSavedLocation(evt) {
    evt.preventDefault();

    let input = evt.target.querySelector("#addLocationInput");
    let locationSearchString = input.value;
    input.value = "";

    if (!locationSearchString) {
        window.alert("Необходимо ввести название локации");
        return;
    }

    let newLocationId = generateLocationId(locationSearchString);
    if (savedLocations.has(newLocationId)) {
        window.alert(`Локация "${newLocationId}" уже добавлена`);
        return;
    }

    try {
        let resp = await fetch(
            `${BACKEND_URL}/favourites`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({'name': newLocationId})
            }
        );
        console.log(resp);

        let newLocation = new Location(SECONDARY_LOCATION_TEMPLATE, locationSearchString, newLocationId,false);
        locationMap.set(newLocationId, newLocation);

        savedLocations.add(newLocationId);

        rebuildLocationList();
    } catch (error) {
        console.log("Failed to add new location ", newLocationId, error);
    }
}


function getCurrentLocationLoader() {
    let weatherTemplate = document.querySelector("#currentLocationTemplateLoader").content;
    return document.importNode(weatherTemplate, true);
}


function rebuildLocationList() {
    let wrapNode = document.querySelector(".block-extra");
    wrapNode.textContent = "";

    for (let [id, item] of locationMap) {
        let node = item.build();
        wrapNode.appendChild(node);
    }
}


async function initSavedLocations() {
    for (let weatherId of savedLocations) {
        let location = new Location("#savedLocationTemplate", weatherId);
        locationMap.set(weatherId, location);
    }
    rebuildLocationList();
}


async function initPage() {
    let favouritesResp = await fetch(`${BACKEND_URL}/favourites`);
    let secondaryWeatherLocationsList = await favouritesResp.json();
    savedLocations = new Set(secondaryWeatherLocationsList.map(({name}) => name));

    initCurrentLocation();
    await initSavedLocations();
}


document.addEventListener("DOMContentLoaded", initPage);
document.querySelector("#addLocationForm").addEventListener("submit", addSavedLocation);
document.querySelector("#refreshGeo").addEventListener("click", initCurrentLocation);
addEventListener('beforeunload',()=>{debugger});