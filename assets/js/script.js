var cityInputEl = document.querySelector('#city');
var countryDropdownEl = document.querySelector('#country');
var stateDropdownEl = document.querySelector('#state');
const apikey = 'ce9bae13cd8dbdb19e59bbc1fe52f608';

var cityMatches = [];

var cityNameTypedHandler = function (event) {
    var city = cityInputEl.value.trim();

    if (city) {
        getCity(city);
    }
};

var getCity = function (city) {
    var apiUrl = 'http://api.openweathermap.org/geo/1.0/direct?q=' + city + '&limit=2&appid=' + apikey;

    fetch(apiUrl)
    .then(function (response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Error: ' + response.statusText);
        }
    })
    .then(function (data) {
        populateCountryDropdown(data);
        cityMatches = data;
    })
    .catch(function (error) {
        alert('Unable to connect to OpenWeather');
    });
}

var populateCountryDropdown = function(data) {
    countryDropdownEl.innerHTML = '';

    data.forEach(function(location) {
        var option = document.createElement('option');
        option.value = location.country;
        option.textContent = location.country;
        countryDropdownEl.appendChild(option);
    });

    if (countryDropdownEl.options.length === 1) {
        countryDropdownEl.selectedIndex = 0;
        countryDropdownEl.dispatchEvent(new Event('change'));
    }    
};

var countrySelectedHandler = function(event) {
    var selectedCountry = countryDropdownEl.value;
    var matchesForSelectedCountry = cityMatches.filter(function(match) {
        return match.country === selectedCountry;
    });

    if (matchesForSelectedCountry.length > 1) {
        populateStateDropdown(matchesForSelectedCountry);
    } else {
        // Clear the state dropdown content and hide it
        stateDropdownEl.innerHTML = '';
        stateDropdownEl.classList.add('hidden');
    }
};

var populateStateDropdown = function(matchesForSelectedCountry) {
    stateDropdownEl.innerHTML = '';

    matchesForSelectedCountry.forEach(function(location) {
        var option = document.createElement('option');
        option.value = location.state;
        option.textContent = location.state;
        stateDropdownEl.appendChild(option);
    });

    if (matchesForSelectedCountry.length > 1) {
        stateDropdownEl.classList.remove('hidden');
    } else {
        stateDropdownEl.classList.add('hidden');
    }
};

var fetchWeatherHandler = function(event) {
    event.preventDefault();

    var selectedCountry = countryDropdownEl.value;
    var matchesForSelectedCountry = cityMatches.filter(function(match) {
        return match.country === selectedCountry;
    });

    if (matchesForSelectedCountry.length === 1) {
        var selectedCity = matchesForSelectedCountry[0];
        fetchCurrentWeather(selectedCity);
        fetchForecast(selectedCity);
        saveCity(matchesForSelectedCountry[0]);
    }
};

function saveCity(selectedCityObj) {
    const saveCity = localStorage.getItem("selectedCity");

    let cities = [];

    if (saveCity === null) {
        cities.push(selectedCityObj);
    } else {
        cities = JSON.parse(saveCity);
        if (!cities.some(city => city.name === selectedCityObj.name && city.country === selectedCityObj.country)) {
            cities.push(selectedCityObj);
        }
        while (cities.length > 5) {
            cities.shift();
        }
    }
    
    localStorage.setItem("selectedCity", JSON.stringify(cities));
    displaySearchHistory();    
};


function displaySearchHistory() {
    const historyDiv = document.getElementById('history');
    const cities = JSON.parse(localStorage.getItem("selectedCity")) || [];
    const buttons = document.querySelectorAll(".block.items-center"); // Select all the buttons using a common class

    cities.forEach((cityObj, index) => {
        if (index < buttons.length) { // Check if there are enough buttons for the cities
            let btn = buttons[index];
            btn.querySelector('span').textContent = cityObj.name + ", " + cityObj.country; // Update the text inside the span
            btn.classList.remove('hidden'); // Unhide the button

            btn.addEventListener('click', function() {
                fetchCurrentWeather(cityObj);
                fetchForecast(cityObj);
            });
        }
    });

    // If the number of cities in storage is less than the number of buttons, hide the unused buttons
    for (let i = cities.length; i < buttons.length; i++) {
        buttons[i].classList.add('hidden');
    }
}

// Call the function to initially populate the search history
displaySearchHistory();


var fetchCurrentWeather = function(city) {
    var lat = city.lat;
    var lon = city.lon;
    var apiUrl = 'https://api.openweathermap.org/data/2.5/weather?lat=' + lat + '&lon=' + lon + '&appid=' + apikey + '&units=metric';

    fetch(apiUrl)
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Error: ' + response.statusText);
        }
    })
    .then(function(data) {
        displayCurrentWeather(data);
        displayCityName(city);

        // Create the formattedDate here
        var date = new Date(data.dt * 1000); // the data.dt value is in seconds, so we multiply by 1000 to convert it to milliseconds
        var formattedDate = date.getFullYear() + '/' + (date.getMonth() + 1).toString().padStart(2, '0') + '/' + date.getDate().toString().padStart(2, '0');
        displayDate(formattedDate);
    })
    
    .catch(function(error) {
        alert('Unable to fetch current weather data.');
    });
};


var displayCurrentWeather = function(weatherData) {
    var currentTemperature = weatherData.main.temp;
    var currentHumidity = weatherData.main.humidity;
    var currentWindSpeed = weatherData.wind.speed;
    var currentWeatherIcon = weatherData.weather[0].icon;

    document.querySelector("#temperature").textContent = "Temperature: " + currentTemperature + "°C";
    document.querySelector("#humidity").textContent = "Humidity: " + currentHumidity + "%";
    document.querySelector("#wind-speed").textContent = "Wind Speed: " + currentWindSpeed + " km/h";
    document.querySelector("#weather-icon").src = "http://openweathermap.org/img/w/" + currentWeatherIcon + ".png";
    document.querySelector("#weather-icon").style.display = "inline-block";  // Show the weather icon
};

// create h2 element to display city name
var displayCityName = function(city) {
    var cityName = city.name;
    var cityHeader = document.querySelector("#weather-selected");
    cityHeader.textContent = cityName;
};

var displayDate = function(formattedDate) {
    var dateHeader = document.querySelector("#date");
    dateHeader.textContent = formattedDate;
};

var fetchForecast = function(city) {
    var lat = city.lat;
    var lon = city.lon;
    var apiUrl = 'https://api.openweathermap.org/data/2.5/forecast?lat=' + lat + '&lon=' + lon + '&appid=' + apikey + '&units=metric';

    fetch(apiUrl)
    .then(function(response) {
        if (response.ok) {
            return response.json();
        } else {
            throw new Error('Error: ' + response.statusText);
        }
    })
    .then(function(data) {
        displayForecast(data);
    })
    .catch(function(error) {
        alert('Unable to fetch forecast data.');
    });
};


var displayForecast = function(weatherData) {
    for (var i = 0, j = 1; i < weatherData.list.length && j <= 5; i+=8, j++) {
        var forecastDay = weatherData.list[i];
        var forecastElem = document.getElementById("forecast-day" + j);

        // Clear out existing content
        forecastElem.innerHTML = '';

        // Create the formattedDate for each forecast day
        var date = new Date(forecastDay.dt_txt);
        var formattedDate = date.getFullYear() + '/' + (date.getMonth() + 1).toString().padStart(2, '0') + '/' + date.getDate().toString().padStart(2, '0');
        
        var dateElem = document.createElement("p");
        dateElem.textContent = formattedDate;
        
        var iconElem = document.createElement("img");
        iconElem.src = "http://openweathermap.org/img/w/" + forecastDay.weather[0].icon + ".png";
        
        var tempElem = document.createElement("p");
        tempElem.textContent = "Temperature: " + forecastDay.main.temp + "°C";
        
        var humidityElem = document.createElement("p");
        humidityElem.textContent = "Humidity: " + forecastDay.main.humidity + "%";
        
        var windElem = document.createElement("p");
        windElem.textContent = "Wind Speed: " + forecastDay.wind.speed + " km/h";
        
        // Append elements to the card
        forecastElem.appendChild(dateElem);
        forecastElem.appendChild(iconElem);
        forecastElem.appendChild(tempElem);
        forecastElem.appendChild(humidityElem);
        forecastElem.appendChild(windElem);
    }
};

    
cityInputEl.addEventListener('change', cityNameTypedHandler);
countryDropdownEl.addEventListener('change', countrySelectedHandler);
document.getElementById('city-form').addEventListener('submit', function(e) {
    e.preventDefault();
})
document.getElementById('city-form').addEventListener('submit', fetchWeatherHandler);

