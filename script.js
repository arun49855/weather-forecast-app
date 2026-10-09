const form = document.getElementById("searchForm");
const cityInput = document.getElementById("cityInput");
const message = document.getElementById("message");
const panel = document.getElementById("weatherPanel");

const weatherDescriptions = {
  0: ["Clear sky", "☀️"], 1: ["Mainly clear", "🌤️"], 2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"], 45: ["Fog", "🌫️"], 48: ["Depositing rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"], 53: ["Drizzle", "🌦️"], 55: ["Dense drizzle", "🌧️"],
  61: ["Slight rain", "🌧️"], 63: ["Moderate rain", "🌧️"], 65: ["Heavy rain", "🌧️"],
  71: ["Slight snow", "🌨️"], 73: ["Moderate snow", "🌨️"], 75: ["Heavy snow", "❄️"],
  80: ["Rain showers", "🌦️"], 81: ["Rain showers", "🌧️"], 82: ["Heavy showers", "⛈️"],
  95: ["Thunderstorm", "⛈️"], 96: ["Thunderstorm with hail", "⛈️"], 99: ["Thunderstorm with hail", "⛈️"]
};

function describe(code) {
  return weatherDescriptions[code] || ["Mixed conditions", "🌡️"];
}

function weekday(dateString) {
  return new Date(`${dateString}T12:00:00`).toLocaleDateString(undefined, { weekday: "short" });
}

async function loadWeather(city) {
  panel.hidden = true;
  message.textContent = "Loading weather…";
  try {
    const geoUrl = new URL("https://geocoding-api.open-meteo.com/v1/search");
    geoUrl.search = new URLSearchParams({ name: city, count: "1", language: "en", format: "json" });
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) throw new Error("Could not search for that city.");
    const geoData = await geoResponse.json();
    const place = geoData.results && geoData.results[0];
    if (!place) throw new Error("City not found. Check the spelling and try again.");

    const forecastUrl = new URL("https://api.open-meteo.com/v1/forecast");
    forecastUrl.search = new URLSearchParams({
      latitude: place.latitude,
      longitude: place.longitude,
      current: "temperature_2m,weather_code,wind_speed_10m",
      daily: "weather_code,temperature_2m_max,temperature_2m_min",
      timezone: "auto",
      forecast_days: "5"
    });
    const forecastResponse = await fetch(forecastUrl);
    if (!forecastResponse.ok) throw new Error("Weather service is temporarily unavailable.");
    const data = await forecastResponse.json();

    document.getElementById("location").textContent = [place.name, place.admin1, place.country].filter(Boolean).join(", ");
    const currentDescription = describe(data.current.weather_code);
    document.getElementById("condition").textContent = currentDescription[0];
    document.getElementById("weatherIcon").textContent = currentDescription[1];
    document.getElementById("temperature").textContent = Math.round(data.current.temperature_2m);
    document.getElementById("wind").textContent = `${Math.round(data.current.wind_speed_10m)} km/h`;
    document.getElementById("high").textContent = `${Math.round(data.daily.temperature_2m_max[0])}°C`;
    document.getElementById("low").textContent = `${Math.round(data.daily.temperature_2m_min[0])}°C`;
    document.getElementById("updated").textContent = `Local forecast · ${new Date().toLocaleString()}`;

    const forecast = document.getElementById("forecast");
    forecast.replaceChildren();
    data.daily.time.forEach((date, index) => {
      const [description, icon] = describe(data.daily.weather_code[index]);
      const card = document.createElement("article");
      card.className = "day";
      const dayName = document.createElement("div");
      dayName.className = "day-name";
      dayName.textContent = index === 0 ? "Today" : weekday(date);
      const dayIcon = document.createElement("div");
      dayIcon.className = "day-icon";
      dayIcon.textContent = icon;
      dayIcon.title = description;
      const temps = document.createElement("div");
      temps.className = "day-temp";
      temps.textContent = `${Math.round(data.daily.temperature_2m_max[index])}° / ${Math.round(data.daily.temperature_2m_min[index])}°`;
      const condition = document.createElement("small");
      condition.textContent = description;
      card.append(dayName, dayIcon, temps, condition);
      forecast.append(card);
    });
    panel.hidden = false;
    message.textContent = "";
  } catch (error) {
    message.textContent = error.message || "Something went wrong. Please try again.";
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const city = cityInput.value.trim();
  if (city) loadWeather(city);
});

loadWeather(cityInput.value.trim());
