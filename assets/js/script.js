var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var labels = {
    total_accounts : 'Total Accounts',
    fb_accounts : 'FB Accounts',
    fb_pages : 'FB Pages',
    reachable_audience : 'Reachable Audience',
    fb_pages_followers : 'FB Pages Followers',
    fb_groups : 'FB Groups',
    fb_groups_followers : 'FB Grpups Followers',
    ig_accounts : 'IG Accounts',
    ig_followers : 'IG Followers',
    budget_usd : 'Budget'
}

var projection = d3.geoMercator()
    .scale(145)
    .translate([width/2, height/2*1.4])

var radius = d3.scaleSqrt()
    .domain([0, 100])
    .range([0, 14]);

var path = d3.geoPath()
    .projection(projection)
    .pointRadius(2.5);

var voronoi = d3.voronoi()
    .extent([[-1, -1], [width + 1, height + 1]]);

var color = d3.scaleThreshold()
    .domain([1,10,100,1000,5000,10000,500000,1000000,100000000,5000000000])
    .range(["rgb(247,251,255)", "rgb(222,235,247)", "rgb(198,219,239)", "rgb(158,202,225)", "rgb(107,174,214)", "rgb(66,146,198)","rgb(33,113,181)","rgb(8,81,156)","rgb(8,48,107)","rgb(3,19,43)"]);

const zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0,0], [width, height]])
    .extent([[0, 0], [width, height]])
    .on("zoom", zoomed);

svg.call(zoom);

var flight_countries,
    world_map_data,
    country_codes;


d3.queue()
    .defer(d3.json, "assets/json/world-countries.json")
    .defer(d3.csv, "assets/csv/countries.csv", typeCountries)
    .defer(d3.csv, "assets/csv/CIB_dec27.csv")
    .defer(d3.json, "assets/json/country-codes.json")
    .await(ready);

function ready(error, world, countries, flights, codes) {
    if (error) throw error;

    world_map_data = world;
    country_codes = codes.features;
    var countryByName = d3.map(countries, d => d.name);

    var parsed_flights = [];
    flights.forEach(flight => {
        var origins = flight.origin_countries.split(", ");
        var targets = flight.target_countries.split(", ");
        origins.forEach(origin => {
            origin = origin.trim();
            if (origin == 'UK' || origin == 'the UK') origin = 'United Kingdom';
            if (origin == 'US' || origin == 'USA') origin = 'United States';
            if (origin == 'UAE') origin = 'United Arab Emirates';
            targets.forEach(target => {
                target = target.trim();
                if (target == 'UK' || target == 'the UK') target = 'United Kingdom';
                if (target == 'US' || target == 'USA') target = 'United States';
                if (target == 'UAE') target = 'United Arab Emirates';
                parsed_flights.push({
                    origin: origin,
                    target: target,
                    flight: flight
                })
            })
        })
    });

    parsed_flights.forEach(function(flight) {
        var source = countryByName.get(flight.origin),
            target = countryByName.get(flight.target);
        if (source && target) {
            // if (source.name != target.name) {
                source.arcs.coordinates.push([source, target]);
                // target.arcs.coordinates.push([target, source]);
                source.flights.push(flight.flight);
                // target.flights.push(flight.flight);
            // }
        }
    });

    flight_countries = countries.filter(d => d.arcs.coordinates.length);

    getFlightData('total_accounts');
    getFlightData('budget_usd');
    drawMap();
    drwaLine();
    drawBudgetChart(flight_countries);
    loadHeatMap(flights);
}

function typeCountries(d) {
    d[0] = +d.longitude;
    d[1] = +d.latitude;
    d.arcs = { 
        type: "MultiLineString", 
        coordinates: []
    };
    d.flights = [];
    return d;
}

function drawMap(size_filter = 'total_accounts') {
    var dataByCountry = [];
    flight_countries.forEach(d => {
        dataByCountry[d.country] = d[size_filter];
    })

    // draw base map
    svg.select("g#land")
        .attr("class", "land")
        .selectAll("path")
        .data(world_map_data.features)
        .enter().append("path")
        .attr("d", path)
        .style("fill", d => {
            var key = country_codes[d.id];
            return color(dataByCountry[key] ? dataByCountry[key] : 1);
        })
}

function getFlightData(size_filter = 'total_accounts') {
    flight_countries.forEach(d => {
        var amount = 0;
        var former_size = 0;
        var val = 0;
        d.flights.forEach(flight => {
            if (!flight[size_filter]) return;
            val = parseInt(flight[size_filter].replace(/\D/g,''));
            if (former_size == val) {
                return;
            } else {
                amount += val;
                former_size = val;
            }
        })
        d[size_filter] = amount;
    })
}

function drwaLine(size_filter = 'total_accounts') {
    var airport = svg.select("g#airports").selectAll(".airport")
        .data(flight_countries)
        .enter().append("g")
        .attr("class", "airport");

    airport.append("path")
        .attr("class", "airport-arc")
        .attr("d", d => path(d.arcs));

    airport.append("path")
        .data(voronoi.polygons(flight_countries.map(projection)))
        .attr("class", "airport-cell")
        .attr("d", d => { return d ? "M" + d.join("L") + "Z" : null; });

    airport.append("circle")
        .attr("cx", d => projection([d.longitude, d.latitude])[0])
        .attr("cy", d => projection([d.longitude, d.latitude])[1])
        .attr("r", 3)
        .style("fill", "#fff")
        .attr("stroke", "#333")
        .attr("stroke-width", 1)

    airport.append("title")
        .text(d => `Origin Country : ${d.name}\nFlights : ${d.arcs.coordinates.length}\n${labels[size_filter]} : ${d[size_filter]}\nBudget: ${d.budget_usd}`);
}

function sizeFilter() {
    var size_filter = document.getElementById("size_filter").value;
    getFlightData(size_filter);


    var dataByCountry = [];
    flight_countries.forEach(d => {
        dataByCountry[d.country] = d[size_filter];
    })
    svg.select("g#land")
        .selectAll("path")
        .style("fill", d => {
            var key = country_codes[d.id];
            return color(dataByCountry[key] ? dataByCountry[key] : 1);
        })

    svg.select("g#airports").selectAll(".airport").select("title")
    .text(d => `Origin Country : ${d.name}\nFlights : ${d.arcs.coordinates.length}\n${labels[size_filter]} : ${d[size_filter]}\nBudget: ${d.budget_usd}`);
}

function zoomed() {
    svg.select("g#land")
        .attr('transform', d3.event.transform);
    svg.select("g#airports")
        .attr('transform', d3.event.transform);
}