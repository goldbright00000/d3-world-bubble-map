var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var projection = d3.geoMercator()
    .scale(125)
    .translate([width/2, height/2*1.3])

var radius = d3.scaleSqrt()
    .domain([0, 100])
    .range([0, 14]);

var path = d3.geoPath()
    .projection(projection)
    .pointRadius(2.5);

var voronoi = d3.voronoi()
    .extent([[-1, -1], [width + 1, height + 1]]);

var flight_countries;

d3.queue()
    .defer(d3.json, "assets/json/world-50m.json")
    .defer(d3.csv, "assets/csv/countries.csv", typeCountries)
    .defer(d3.csv, "assets/csv/flightciv.csv")
    .await(ready);

function ready(error, world, countries, flights) {
    if (error) throw error;

    drawMap(world);

    var countryByName = d3.map(countries, function(d) { return d.name; });

    var parsed_flights = [];
    flights.forEach(flight => {
        var origins = flight.origin_countries.split(", ");
        var targets = flight.target_countries.split(", ");
        origins.forEach(origin => {
            if (origin == 'UK' || origin == 'the UK') origin = 'United Kingdom';
            if (origin == 'US' || origin == 'USA') origin = 'United States';
            targets.forEach(target => {
                if (target == 'UK' || target == 'the UK') target = 'United Kingdom';
                if (target == 'US' || target == 'USA') target = 'United States';
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
            if (source.name != target.name) {
                source.arcs.coordinates.push([source, target]);
                target.arcs.coordinates.push([target, source]);
                source.flights.push(flight.flight);
                target.flights.push(flight.flight);
            }
        }
    });

    flight_countries = countries.filter(d => d.arcs.coordinates.length);
    drwaLine();
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

function drawMap(map) {
    // draw base map
    svg.select("g#land").append("path")
        .datum(topojson.feature(map, map.objects.countries))
        .attr("class", "land")
        .attr("d", path);
  
    // draw interior borders
    svg.select("g#land").append("path")
        .datum(topojson.mesh(map, map.objects.countries, (a, b) => a !== b))
        .attr("class", "border interior")
        .attr("d", path);
  
    // draw exterior borders
    svg.select("g#land").append("path")
        .datum(topojson.mesh(map, map.objects.countries, (a, b) => a === b))
        .attr("class", "border exterior")
        .attr("d", path);
}

function drwaLine(size_filter = 'total_accounts') {
    document.getElementById("airports").innerHTML = "";
    var airport = svg.select("g#airports").selectAll(".airport")
        .data(flight_countries)
        .enter().append("g")
        .attr("class", "airport");

    airport.append("title")
        .text(d => d.name + "\n" + d.arcs.coordinates.length + " flights");

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
        .attr("r", d => {
            var radius = 0;
            d.flights.forEach(flight => {
                radius += parseInt(flight[size_filter]);
            })
            radius /= 200;
            radius = radius > 2 ? radius : 2;
            return radius;
        })
        .style("fill", "#fff" )
        .attr("stroke", "#666" )
        .attr("stroke-width", 1)
        .attr("fill-opacity", .4);
}

function sizeFilter() {
    var size_filter = document.getElementById("size_filter").value;
    drwaLine(size_filter);
}