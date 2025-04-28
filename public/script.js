let map;

fetch("/mapbox")
    .then((response) => response.json())
    .then((parsed) => {
        const apiKey = parsed.apiKey;

        mapboxgl.accessToken = apiKey;

        map = new mapboxgl.Map({
            container: "map", // container ID
            center: [-75.1652, 39.9526], // starting position [lng, lat]
            zoom: 12.25, // starting zoom
            style: "mapbox://styles/kyleroshanravan/cm83ce7sv000s01qihze5h6px",
        });
    });

const routesList = $("#routes-list");

// The rest of the route IDs that aren't listed here are considered buses by default
const trolleyRoutes = [
    /*old 10, 11, 15, 34, 36, 101, 102*/
    "T1",
    "T2",
    "T3",
    "T4",
    "T5",
    "D1",
    "D2",
];
const subwayRoutes = [];

// How long it takes to update a route after it's selected (in seconds)
let dataUpdateTime = 6;

let latestData;
let activeRouteStops;
let activeButton = $();

const vehicleMarkers = {};
const vehicleMarkerDirections = {};

async function getSeptaData(query) {
    try {
        const response = await fetch(
            `/septa-data${query != undefined ? "?" + query : ""}`
        );
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log("SEPTA Data:", data); // Check what the API returns
        latestData = data;
        displayData();
    } catch (error) {
        console.error("Error fetching SEPTA data:", error);
        routesList.html(`<div class="text-center">
            <i class="bi bi-x-circle fs-1"></i>
            <div>There was an Error fetching SEPTA data:</div>
            <p>${error}</p>
        </div>`);
    }
}

async function getSeptaStopData(query) {
    try {
        const response = await fetch(
            `/septa-stop-data${query != undefined ? "?route=" + query : ""}`
        );
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();
        console.log("SEPTA Stop Data:", data); // Check what the API returns
        activeRouteStops = data;
        displayRouteInfo(query);
    } catch (error) {
        console.error("Error fetching SEPTA Stop data:", error);
        routesList.html(`<div class="text-center">
            <i class="bi bi-x-circle fs-1"></i>
            <div>There was an Error fetching SEPTA Stop data:</div>
            <p>${error}</p>
        </div>`);
    }
}

//<i class="bi bi-bus-front"></i>
//<i class="bi bi-train-front"></i>
//<i class="bi bi-train-lightrail-front"></i>
function displayData() {
    routesList.html("");
    for (let route in latestData.routes[0]) {
        // routesList.append("<p>test</p>").append("<p>test2</p>");
        // console.log(data.routes[0][route]);
        const vehicles = latestData.routes[0][route].length;

        let card = $(`<div class="card route" data-route="${route}"></div>`);
        let cardBody = $(`<div class="card-body"></div>`);
        let cardTitle =
            $(`<div class="d-flex flex-row align-items-center gap-2">
            ${
                !trolleyRoutes.includes(route) && !subwayRoutes.includes(route)
                    ? "<i class='bi bi-bus-front fs-3'></i>"
                    : trolleyRoutes.includes(route)
                    ? "<i class='bi bi-train-lightrail-front fs-3'></i>"
                    : "<i class='bi bi-train-front fs-3'></i>"
            }
            <h5 class="card-title m-0">${route}</h5>
        </div>`);
        let cardText = $(
            `<p>${vehicles} Vehicle${vehicles != 1 ? "s" : ""}</p>`
        );
        let cardText2 = $(`<p>Placeholder</p>`);
        let button = $(
            `<button type="button" class="btn btn-dark">Track</button>`
        );

        button.on("click", () => {
            // Reset other disabled buttons
            activeButton.removeClass("disabled");

            // Disable current button
            button.addClass("disabled");
            activeButton = button;
            getSeptaStopData(route);
        });

        card.append(
            cardBody
                .append(cardTitle)
                .append(cardText)
                .append(cardText2)
                .append(button)
        );

        routesList.append(card);
    }
}

// Call the function when the page loads
getSeptaData();

// function removeStopLayer() {
//     if (map.getLayer("route")) {
//         map.removeLayer("route");
//     }
//     if (map.getSource("route")) {
//         map.removeSource("route");
//     }
//     //also remove markers, if implemented
// }

function displayRouteInfo(route) {
    // removeStopLayer();
    // Display route line to the map
    // const routeGeoJSON = {
    //     type: "Feature",
    //     geometry: {
    //         type: "LineString",
    //         coordinates: activeRouteStops.map((stop) => [
    //             parseFloat(stop.lng),
    //             parseFloat(stop.lat),
    //         ]),
    //     },
    // };

    // map.addSource("route", {
    //     type: "geojson",
    //     data: routeGeoJSON,
    // });

    // map.addLayer({
    //     id: "route",
    //     type: "line",
    //     source: "route",
    //     layout: {
    //         "line-join": "round",
    //         "line-cap": "round",
    //     },
    //     paint: {
    //         "line-color": "#000000",
    //         "line-width": 4,
    //     },
    // });

    // Add stop markers
    activeRouteStops.forEach((stop) => {
        const el = document.createElement("div");
        el.className = "stop";

        new mapboxgl.Marker(el)
            .setLngLat([stop.lng, stop.lat])
            .setPopup(new mapboxgl.Popup().setText(stop.stopname))
            .addTo(map);
    });

    const routeInfo = $("#route-info");

    routeInfo.html("");
    routeInfo.addClass("w-25");
    routeInfo.addClass("p-4");
    $("#map").css("width", "50%");

    const vehicleType =
        !trolleyRoutes.includes(route) && !subwayRoutes.includes(route)
            ? "Bus"
            : trolleyRoutes.includes(route)
            ? "Trolley"
            : "Train";

    routeInfo.html(
        `<div class="d-flex flex-row align-items-center gap-2"><h2 class="m-0">Route</h2> ${
            vehicleType == "Bus"
                ? "<i class='bi bi-bus-front fs-3'></i>"
                : vehicleType == "Trolley"
                ? "<i class='bi bi-train-lightrail-front fs-3'></i>"
                : "<i class='bi bi-train-front fs-3'></i>"
        }<h2 class="m-0">${route}</h2></div>
        <p>Vehicle(s) in Route:</p>
        <div id="vehicles" class="d-flex flex-column gap-4 overflow-y-auto"></div>`
    );

    for (let vehicle in latestData.routes[0][route]) {
        // console.log(latestData.routes[0][route][vehicle].VehicleID);

        const vehicleNotInService =
            latestData.routes[0][route][vehicle].VehicleID == "NONE" ||
            latestData.routes[0][route][vehicle].VehicleID == "None" ||
            latestData.routes[0][route][vehicle].VehicleID == "" ||
            latestData.routes[0][route][vehicle].VehicleID == "0";

        let container = $(`<div class="card p-4"></div>`);

        let title = $(
            `<h5 class="card-title">${
                vehicleNotInService
                    ? "<p class='text-danger'>Out of Service</p>"
                    : (!trolleyRoutes.includes(route) &&
                      !subwayRoutes.includes(route)
                          ? "Bus #"
                          : trolleyRoutes.includes(route)
                          ? "Trolley #"
                          : "Train #") +
                      latestData.routes[0][route][vehicle].VehicleID
            }</div>`
        );

        let button = $(
            `<button type="button" class="btn ${
                vehicleNotInService ? "btn-danger disabled" : "btn-dark"
            }">Follow</button>`
        );

        button.on("click", () => {
            // console.log(latestData.routes[0][route][vehicle].VehicleID);
            selectVehicle(
                vehicleType,
                route,
                latestData.routes[0][route][vehicle].VehicleID
            );
            // Zoom into vehicle
        });

        $("#vehicles").append(container.append(title).append(button));

        if (!vehicleNotInService) {
            addVehicleToMap(
                latestData.routes[0][route][vehicle].lng,
                latestData.routes[0][route][vehicle].lat,
                vehicleType,
                route,
                vehicleNotInService
                    ? "Not in Service"
                    : latestData.routes[0][route][vehicle].VehicleID
            );
        }
    }

    // Continously call to update each vehicle with new data via API
    setInterval(() => {
        updateVehiclePositions(vehicleType, route);
    }, dataUpdateTime * 1000);
}

// Query routes from search
function queryRoutes(input) {
    console.log(input);

    $(".route")
        .filter(function () {
            let route = String($(this).data("route")).toLowerCase();
            return !route.includes(input.toLowerCase());
        })
        .hide();

    $(".route")
        .filter(function () {
            let route = String($(this).data("route")).toLowerCase();
            return route.includes(input.toLowerCase());
        })
        .show();
}

function addVehicleToMap(lng, lat, type, route, vehicleID) {
    if (vehicleMarkers[vehicleID]) {
        // Vehicle is already cached
        vehicleMarkerDirections[vehicleID].setLngLat([lng, lat]);
        vehicleMarkers[vehicleID].setLngLat([lng, lat]);
    } else {
        const vehicle = $(
            `<div class="vehicle-marker cursor-pointer" style="cursor: pointer;"></div>`
        );
        if (type == "Bus") {
            vehicle.append(`<i class='bi bi-bus-front fs-4'></i>`);
        } else if (type == "Trolley") {
            vehicle.append(`<i class='bi bi-train-lightrail-front fs-4'></i>`);
        } else if (type == "Train") {
            vehicle.append(`<i class='bi bi-train-front fs-4'></i>`);
        }
        // vehicle.html(vehicleID);
        vehicle.append(
            `<span class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-secondary">${
                "#" + vehicleID
            }</span>`
        );

        const directionalArrow = document.createElement("div");
        directionalArrow.className = "vehicle-direction-arrow";

        vehicleMarkerDirections[vehicleID] = new mapboxgl.Marker(
            directionalArrow
        )
            .setLngLat([lng, lat])
            .addTo(map);

        vehicleMarkers[vehicleID] = new mapboxgl.Marker(vehicle.get(0))
            .setLngLat([lng, lat])
            // .setPopup(new mapboxgl.Popup().setText(type + " #" + vehicleID))
            .addTo(map);
    }
}

async function updateVehiclePositions(type, route) {
    // Display update tracker

    try {
        const response = await fetch(`/septa-specific-data?route=${route}`);
        if (!response.ok) {
            throw new Error("Network response was not ok");
        }
        const data = await response.json();

        for (let vehicle in data.bus) {
            const vehicleNotInService =
                data.bus[vehicle].VehicleID == "NONE" ||
                data.bus[vehicle].VehicleID == "None" ||
                data.bus[vehicle].VehicleID == "" ||
                data.bus[vehicle].VehicleID == "0";

            if (!vehicleNotInService)
                addVehicleToMap(
                    data.bus[vehicle].lng,
                    data.bus[vehicle].lat,
                    type,
                    route,
                    data.bus[vehicle].VehicleID
                );

            // console.log("updated vehicle " + data.bus[vehicle].VehicleID);
        }
    } catch (error) {
        console.error("Error fetching SEPTA Stop data:", error);
        routesList.html(`<div class="text-center">
            <i class="bi bi-x-circle fs-1"></i>
            <div>There was an Error fetching SEPTA Stop data:</div>
            <p>${error}</p>
        </div>`);
    }
}

async function selectVehicle(type, route, vehicleID) {
    const vehicleOverview = $(
        `<div id="vehicle-overview" class="fade show"></div>`
    );
    $("#map").append(vehicleOverview);
    let id = $(
        `<h1 class="text-center">${
            (!trolleyRoutes.includes(route) && !subwayRoutes.includes(route)
                ? "Bus #"
                : trolleyRoutes.includes(route)
                ? "Trolley #"
                : "Train #") + vehicleID
        }</h1>`
    );
    // Find next stop
    let nextStop = $(``);

    // Distance between vehicle and next stop
    let from = turf.point([1, 1]);
    let to = turf.point([0, 0]);

    let distance = turf.distance(from, to);
    console.log(distance);

    // Estimated time until next stop

    vehicleOverview.append(id);
}
