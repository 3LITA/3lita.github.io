const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const html = `
    <div class="wrapper">
        <header>
            <h1 class="mr-2rem">Погода здесь</h1>
            <button id="refreshGeo" class="refresh-geo">Обновить геолокацию</button>
            <button class="refresh-btn">
                <img class="refresh-icon" src="img/refresh.png" alt="refresh-geo">
            </button>
            <div class="space"></div>
        </header>
    
        <main>
            <div class="block block-main mt-1rem"></div>
    
            <div class="input-block mt-2rem">
                <h2>Избранное</h2>
    
                <form id="addLocationForm">
                    <input id="addLocationInput" class="input-form mr-2rem" type="text" placeholder="Добавить новый город">
                    <button id="addLocationButton" class="add-btn round-btn" type="submit">+</button>
                </form>
            </div>
    
            <ul class="block block-extra"></ul>
        </main>
    </div>
    <template id="currentLocationTemplate">
        <div class="main-location-info" name="container">
            <h2 class="main-location-name" name="location">Saint Petersburg</h2>
            
            <div class="main-location-flex">
                <img class="weather-large-icon mr-2rem" src="" alt="large weather icon" name="icon">
                <span class="current-temperature" name="temperature"></span>
            </div>
        </div>
    
        <ul class="main-location-stats">
            <li class="row" name="wind">
                <span class="row-title">Ветер</span>
                <span class="row-text"></span>
            </li>
            <li class="row" name="clouds">
                <span class="row-title">Облачность</span>
                <span class="row-text"></span>
            </li>
            <li class="row" name="pressure">
                <span class="row-title">Давление</span>
                <span class="row-text"></span>
            </li>
            <li class="row" name="humidity">
                <span class="row-title">Влажность</span>
                <span class="row-text"></span>
            </li>
            <li class="row" name="coordinates">
                <span class="row-title">Координаты</span>
                <span class="row-text"></span>
            </li>
        </ul>
    </template>
    
    <template id="savedLocationTemplate">
        <li class="info-block" name="container">
            <div class="extra-city-header">
                <h3 name="location"></h3>
                <span class="temperature" name="temperature"></span>
                <img class="weather-small-icon" src="" alt="small weather icon" name="icon">
                <button class="remove-btn round-btn">✖</button>
            </div>
            <ul class="city-stats">
                <li class="row" name="wind">
                    <span class="row-title">Ветер</span>
                    <span class="row-text"></span>
                </li>
                <li class="row" name="clouds">
                    <span class="row-title">Облачность</span>
                    <span class="row-text"></span>
                </li>
                <li class="row" name="pressure">
                    <span class="row-title">Давление</span>
                    <span class="row-text"></span>
                </li>
                <li class="row" name="humidity">
                    <span class="row-title">Влажность</span>
                    <span class="row-text"></span>
                </li>
                <li class="row" name="coordinates">
                    <span class="row-title">Координаты</span>
                    <span class="row-text"></span>
                </li>
            </ul>
        </li>
    </template>
    
    <template id="currentLocationTemplateLoader">
        <div name="container">
            <h3>Загрузка данных...</h3>
        </div>
    </template>
    
    <template id="savedLocationTemplateLoader">
        <div name="container">
            <h3>Загрузка данных...</h3>
        </div>
    </template>
    
    <template id="savedLocationTemplateError">
        <li class="info-block">
            <div class="extra-city-header" name="container">
                <h3></h3>
                <button class="remove-btn round-btn">✖</button>
            </div>
            <h4 name="error"></h4>
        </li>
    </template>
`
const dom = new JSDOM(html)

global["window"] = dom.window
global["document"] = dom.window.document
const positions = {
    coords: {
        latitude: '12',
        longitude: '23',
    }
}

global["navigator"] = {
    geolocation:{
        getCurrentPosition: (res, rej, opts) => res(positions),
    }
}

global["alert"] = (msg) => console.info(msg)