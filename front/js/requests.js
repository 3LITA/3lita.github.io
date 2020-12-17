import { BACKEND_URL } from "./config.js";


export default class Api {
    static async fetchWeatherByCoordinates(coordinates) {
        return await fetch(`${BACKEND_URL}/weather/coordinates?lat=${coordinates.lat}&long=${coordinates.long}`);
    }

    static async fetchWeatherByLocationName(locationName) {
        return await fetch(`${BACKEND_URL}/weather/city?q=${locationName}`);
    }

    static async addFavouriteLocation(locationName) {
        return await fetch(
            `${BACKEND_URL}/favourites`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({'name': locationName})
            }
        );
    }

    static async deleteLocation(locationId) {
        return await fetch(`${BACKEND_URL}/favourites/${locationId}`, {method: 'DELETE'}).then(() => {});
    }

    static async getFavouriteLocations() {
        return await fetch(`${BACKEND_URL}/favourites`);
    }
}
