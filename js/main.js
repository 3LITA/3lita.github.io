import { API_KEY, DEFAULT_LOCATION } from './config.js'


var locationMap = new Map();
var savedLocations = new Set();


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
    constructor(templateId, location, customId = null) {
        this.templateId = templateId;
        this.location = location;
        this.customId = customId;

        this.weatherData = null;
    }

    async fetchWeather() {
        try {
            var resp = await fetch(`https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${this.location}`);
        } catch (e) {
            if (!(e instanceof TypeError)) {
                throw e;
            }
            throw new WeatherError(e.message);
        }

        switch(resp.status) {
            case 200:
                this.weatherData = await resp.json();
                return true;
            case 400:
                throw new WeatherError(`Локация "${this.location}" не обнаружена`);
            default:
                throw new WeatherError("Ошибка работы API");
        }
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

        weatherTemplate.querySelector('*[name="location"').textContent = this.weatherData.location.name;
        weatherTemplate.querySelector('img[name="icon"]').src = `https://${this.weatherData.current.condition.icon.replace("64x64", "128x128")}`;
        weatherTemplate.querySelector('span[name="temperature"]').textContent = `${this.weatherData.current.temp_c}°C`;

        weatherTemplate.querySelector('li[name="wind"] span.row-text').textContent = `${this.weatherData.current.wind_kph} kph ${this.weatherData.current.wind_dir}`;
        weatherTemplate.querySelector('li[name="clouds"] span.row-text').textContent = this.weatherData.current.condition.text;
        weatherTemplate.querySelector('li[name="pressure"] span.row-text').textContent = `${this.weatherData.current.pressure_mb} mb`;
        weatherTemplate.querySelector('li[name="humidity"] span.row-text').textContent = `${this.weatherData.current.humidity}%`;
        weatherTemplate.querySelector('li[name="coordinates"] span.row-text').textContent = `[${this.weatherData.location.lat}, ${this.weatherData.location.lon}]`;

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

    fillDataError(errorMessage) {
        let errorTemplate = document.querySelector(`${this.templateId}Error`).content;

        try {
            errorTemplate.querySelector('h3').textContent = this.location;
        } catch (e) {}
        errorTemplate.querySelector('h4').textContent = errorMessage;

        let clone = document.importNode(errorTemplate, true);
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

        let rawLocationId = this.customId ? this.customId : this.location;
        this.locationId = generateLocationId(rawLocationId);
        loader.querySelector('*[name="container"]').id = this.locationId;

        this.fetchWeather()
            .then(() => {
                let newData = this.fillData();
                let oldData = document.querySelector(`#${this.locationId}`);
                oldData.parentNode.replaceChild(newData, oldData);
            })
            .catch((e) => {
                if (e instanceof WeatherError) {
                    alert(e);
                    this.delete();
                    return;
                }
                console.log(e);
            });

        return document.importNode(loader, true);
    }

    delete() {
        deleteSavedLocation(this.locationId);
    }
}


function saveLocations() {
    localStorage.setItem("savedLocations", JSON.stringify(Array.from(savedLocations)));
}


function initCurrentLocation() {
    let wrapNode = document.querySelector(".block-main");
    wrapNode.textContent = "";
    wrapNode.appendChild(getCurrentLocationLoader());
    navigator.geolocation.getCurrentPosition(loadCurrentLocation, loadDefaultLocation);
}


async function loadCurrentLocation(location) {
    if (location instanceof GeolocationPosition) {
        location = `${location.coords.latitude},${location.coords.longitude}`;
    }

    let primaryWeatherItem = new Location("#currentLocationTemplate", location, "_here");
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

    if (locationSearchString == "") {
        window.alert("Необходимо ввести название локации");
        return;
    }

    let newLocationId = generateLocationId(locationSearchString);
    if (savedLocations.has(newLocationId)) {
        window.alert(`Локация "${newLocationId}" уже добавлена`);
        return;
    }
    
    let newLocation = new Location("#savedLocationTemplate", locationSearchString, newLocationId);
    locationMap.set(newLocationId, newLocation);

    savedLocations.add(newLocationId);
    saveLocations();

    rebuildLocationList();
}


function deleteSavedLocation(nodeId) {
    locationMap.delete(nodeId);
    savedLocations.delete(nodeId);
    saveLocations();

    rebuildLocationList();
}


function getCurrentLocationLoader() {
    let weatherTemplate = document.querySelector("#currentLocationTemplateLoader").content;
    return document.importNode(weatherTemplate, true);
}


function rebuildLocationList() {
    let wrapNode = document.querySelector(".block-extra");
    wrapNode.textContent = "";

    for (var [id, item] of locationMap) {
        let node = item.build();
        wrapNode.appendChild(node);
    }
}


async function initSavedLocations() {
    for (var weatherId of savedLocations) {
        let location = new Location("#savedLocationTemplate", weatherId);
        locationMap.set(weatherId, location);
    }
    rebuildLocationList();
}


async function initPage() {
    let localStorageLocations = localStorage.getItem("savedLocations");
    if (localStorageLocations != null) {
        savedLocations = new Set(JSON.parse(localStorageLocations));
    }
    initCurrentLocation();
    await initSavedLocations();
}


document.addEventListener("DOMContentLoaded", initPage);
document.querySelector("#addLocationForm").addEventListener("submit", addSavedLocation);
document.querySelector("#refreshGeo").addEventListener("click", initCurrentLocation);