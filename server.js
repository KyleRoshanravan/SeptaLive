const express = require("express");
const app = express();
const path = require("path");

const turf = require("@turf/turf");

const fetch = require("node-fetch");
const cors = require("cors");

require("dotenv").config();

const port = 3001;

app.use(cors());

app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "node_modules/bootstrap/dist/")));
app.use("/node_modules", express.static(path.join(__dirname, "node_modules")));
app.use(
    "/jquery",
    express.static(path.join(__dirname, "node_modules/jquery/dist/"))
);

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/septa-data", async (req, res) => {
    try {
        const response = await fetch(
            "https://www3.septa.org/api/TransitViewAll/index.php"
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch Septa Data" });
    }
});

app.get("/septa-specific-data", async (req, res) => {
    try {
        const route = req.query.route;

        const response = await fetch(
            "https://www3.septa.org/api/TransitView/index.php?route=" + route
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch Septa Specific Data" });
    }
});

app.get("/septa-stop-data", async (req, res) => {
    try {
        const route = req.query.route;

        const response = await fetch(
            "https://www3.septa.org/api/Stops/index.php?req1=" + route
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch Septa Stop Data" });
    }
});

// Get api key for mapbox
app.get("/mapbox", (req, res) => {
    res.json({ apiKey: process.env.API_KEY });
});

app.listen(port, () => {
    console.log(`Started server on port ${port}.`);
});
