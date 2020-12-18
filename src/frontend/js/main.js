import { DEFAULT_LOCATION, PRIMARY_LOCATION_TEMPLATE, SECONDARY_LOCATION_TEMPLATE } from './config.js'
import Api from './requests.js';


let locationMap = new Map();
let savedLocations = new Set();


function generateLocationId(src) {
    return src.replace(" ", "-").toLowerCase();
}


class WeatherError extends Error {
    constructor(message) {
        super(message);
        this.name = "WeatherError";
    }
}


class Location {
    constructor(templateId, locationName = null, customId = null, coordinates = null) {
        this.templateId = templateId;
        this.coordinates = coordinates;
        this.locationName = locationName;
        this.customId = customId;

        this.weatherData = null;
    }

    async fetchWeather() {
        let resp;
        try {
            if (this.coordinates) {
                resp = await Api.fetchWeatherByCoordinates(this.locationName);
            } else {
                resp = await Api.fetchWeatherByLocationName(this.locationName);
            }
        } catch (e) {
            console.log("Unexpected error occurred", e)
            return;
        }

        switch (resp.status) {
            case 200:
                this.weatherData = await resp.json();
                return;
            case 404:
                window.alert(`Локация ${this.locationName} не найдена!`)
                await this.delete();
                return;
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
            let item = this;
            remove_btn.addEventListener("click", async function () {
                await item.delete();
            }, false);
        }

        return clone;
    }

    showLoadingPreview() {
        let wrapNode = document.querySelector(".block-extra");

        let loader = document.querySelector(`${this.templateId}Loader`).content;
        let rawLocationId = this.customId ? this.customId : this.locationName;
        this.locationId = generateLocationId(rawLocationId);
        loader.querySelector('*[name="container"]').id = this.locationId;
        wrapNode.appendChild(document.importNode(loader, true));
    }

    removeLoadingPreview() {
        let loadingPreview = document.querySelector(`#${this.locationId}`)
        loadingPreview.parentNode.removeChild(loadingPreview);
    }

    load() {
        let loader = document.querySelector(`${this.templateId}Loader`).content;
        let rawLocationId = this.customId ? this.customId : this.locationName;
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
        let removeBtn = document.querySelector(`#${this.locationId} div.extra-city-header button.remove-btn`);
        if (removeBtn) {
            removeBtn.disabled = true;
        }
        await Api.deleteLocation(this.locationId);

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


async function addFavouriteLocation(evt) {
    evt.preventDefault();

    let input = evt.target.elements.favouriteLocation;
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

    let newLocation = new Location(SECONDARY_LOCATION_TEMPLATE, locationSearchString, newLocationId, false);

    newLocation.showLoadingPreview();

    try {
        let resp = await Api.addFavouriteLocation(newLocationId);
        switch (resp.status) {
            case 200:
                locationMap.set(newLocationId, newLocation);
                savedLocations.add(newLocationId);

                rebuildLocationList();
                return;
            case 404:
                window.alert(`Локация "${locationSearchString}" не найдена!`);
                return;
            default:
                window.alert(`Ошибка работы API!`);
        }
    } catch (e) {
        if (e instanceof TypeError) {
            newLocation.removeLoadingPreview();
            window.alert("Пропало интернет-соединение. Повторите попытку позже")
        }
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
        let location = new Location(SECONDARY_LOCATION_TEMPLATE, weatherId);
        locationMap.set(weatherId, location);
    }
    rebuildLocationList();
}


async function initPage() {
    let favouritesResp = await Api.getFavouriteLocations();
    let secondaryWeatherLocationsList = await favouritesResp.json();
    savedLocations = new Set(secondaryWeatherLocationsList.map(({name}) => name));

    initCurrentLocation();
    await initSavedLocations();
}


document.addEventListener("DOMContentLoaded", initPage);
document.querySelector("#addLocationForm").addEventListener("submit", addFavouriteLocation);
document.querySelector("#refreshGeo").addEventListener("click", initCurrentLocation);


export {
    initPage,
    initCurrentLocation,
    initSavedLocations,
    loadCurrentLocation,
    loadDefaultLocation,
    addFavouriteLocation,
    savedLocations,
    Location
}