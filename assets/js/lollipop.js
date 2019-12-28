function drawBudgetChart(data) {
    // set the dimensions and margins of the graph
    var margin = {top: 40, right: 30, bottom: 100, left: 100},
        width = 800 - margin.left - margin.right,
        height = 25 * data.length - margin.top - margin.bottom;

    // append the svg object to the body of the page
    var svg = d3.select("#lollipop")
    .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
    .append("g")
        .attr("transform",
            "translate(" + margin.left + "," + margin.top + ")");

    // sort data
    data.sort(function(b, a) {
        return a.budget_usd - b.budget_usd;
    });

    var budgets = data.map(d => d.budget_usd);
    var max_budget = Math.max(...budgets);

    // Add X axis
    var x = d3.scaleLinear()
        .domain([0, max_budget * 11 / 10])
        .range([ 0, width])
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    // Y axis
    var y = d3.scaleBand()
        .range([ 0, height ])
        .domain(data.map(function(d) { return d.name; }))
        .padding(1);
    svg.append("g")
        .call(d3.axisLeft(y))

    var line = svg.selectAll(".line")
        .data(data)
        .enter().append("g")
        .attr("class", "line");

    // Lines
    line.append("line")
        .attr("x1", function(d) { return x(d.budget_usd); })
        .attr("x2", x(0))
        .attr("y1", function(d) { return y(d.name); })
        .attr("y2", function(d) { return y(d.name); })
        .attr("stroke", "grey")

    // Circles
    line.append("circle")
        .attr("cx", function(d) { return x(d.budget_usd); })
        .attr("cy", function(d) { return y(d.name); })
        .attr("r", "7")
        .style("fill", "#69b3a2")
        .attr("stroke", "black")

    // Tooltips
    line.append("title")
        .text(d => d.budget_usd);
}