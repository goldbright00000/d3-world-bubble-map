function loadHeatMap(flights) {
    var data = [];
    var vars = [];
    flights.forEach(flight => {
        var countries = flight.origin_countries.split(", ");
        var keywords = flight.keywords.split(", ");
        countries.forEach(country => {
            country = country.trim();
            if (!data[country]) {
                data[country] = [];
            }
            
            keywords.forEach(keyword => {
                keyword = keyword.trim();
                if (!data[country][keyword]) {
                    data[country][keyword] = 0;
                }
                data[country][keyword]++;
                if (!vars[keyword]) {
                    vars[keyword] = 0;
                }
                vars[keyword]++;
            })
        })
    });
    // Labels of row and columns
    var myGroups = [];
    for (const key in data) {
        myGroups.push(key);
    }
    myGroups = myGroups.sort();
    var myVars = [];
    for (const key in vars) {
        if (key) myVars.push(key);
    }
    myVars = myVars.sort();

    var heatmap_data = [];
    var index = 0;
    myGroups.forEach(group => {
        myVars.forEach(myVar => {
            heatmap_data[index] = {
                group: group,
                variable: myVar,
                value: data[group][myVar] ? data[group][myVar] : 0
            }
            index++;
        })
    })

    drawHeatMap(myGroups, myVars, heatmap_data);
}

function drawHeatMap(myGroups, myVars, heatmap_data) {
    // set the dimensions and margins of the graph
    var margin = {top: 30, right: 30, bottom: 200, left: 250},
    width = 30 * myGroups.length - margin.left - margin.right,
    height = 12 * myVars.length - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var heatmap_svg = d3.select("#my_dataviz")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Build X scales and axis:
    var x = d3.scaleBand()
        .range([ 0, width ])
        .domain(myGroups)
        .padding(0.01);
    heatmap_svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")	
            .style("text-anchor", "end")
            .attr("dx", "-.8em")
            .attr("dy", ".15em")
            .attr("transform", "rotate(-65)");

    // Build y scales and axis:
    var y = d3.scaleBand()
        .range([ height, 0 ])
        .domain(myVars)
        .padding(0.01);
    heatmap_svg.append("g")
        .call(d3.axisLeft(y));

    // Build color scale
    var myColor = d3.scaleLinear()
        .range(["#eee", "#69B3A2"])
        .domain([0,2])

    // create a tooltip
    var tooltip = d3.select("#my_dataviz")
        .append("div")
        .style("opacity", 0)
        .attr("class", "tooltip")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "2px")
        .style("border-radius", "5px")
        .style("padding", "5px")

    // Three function that change the tooltip when user hover / move / leave a cell
    var mouseover = function(d) {
        tooltip.style("opacity", 1)
    }
    var mousemove = function(d) {
        var left = d3.mouse(this)[0]+20+$('#my_dataviz svg').offset().left+margin.left;
        var top = d3.mouse(this)[1]-20+$('#my_dataviz svg').offset().top+margin.top;
        tooltip
            .html(`Origin Country : ${d.group} <br> Keyword : ${d.variable} <br> Value : ${d.value}`)
            .style("left", (left) + "px")
            .style("top", (top) + "px")
    }
    var mouseleave = function(d) {
        tooltip.style("opacity", 0)
    }

    // add the squares
    heatmap_svg.selectAll()
        .data(heatmap_data, function(d) {return d.group+':'+d.variable;})
        .enter()
        .append("rect")
        .attr("x", function(d) { return x(d.group) })
        .attr("y", function(d) { return y(d.variable) })
        .attr("width", x.bandwidth() )
        .attr("height", y.bandwidth() )
        .style("fill", function(d) { return myColor(d.value)} )
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
}