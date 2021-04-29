// import * as d3 from "d3";
// import "./styles.css";
import * as scrollTriggers from "./scrollTriggers";
import { loadFlowerData, ready } from "./flowers.js";

// Loading Data
async function getFlowerInfo() {
  let flowerData = await loadFlowerData();
  return ready(flowerData);
}

const environmentData = getFlowerInfo();
const coloradoMap = d3.json("./data/ColoradoCounties.geojson");

// load county view data
const countyPointsOfInterest = d3.csv("./data/CountyData.csv");

// Setup the base SVG
const width = 900;
const height = 700;

var svg = d3
  .select(".map")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", "0 0 " + width + " " + height)
  .classed("svg-content", true);

// Setup D3 Map Projection
var projection = d3
  .geoMercator()
  .translate([width / 2, height / 2])
  .scale(5300)
  .center([-105.5, 39]); //40, 104
var path = d3.geoPath().projection(projection);

// State texture and color mapping
var tilling = d3.scaleQuantize().domain([0, 75]).range(["A", "B", "C"]);
var coloring = d3.scaleQuantile().domain([0, 15]).range(["A", "B", "C"]);
//console.log(coloring(10));

// After the map and flower data is loaded...
Promise.all([coloradoMap, environmentData, countyPointsOfInterest]).then(
  (res) => {
    // --- DATA CLEANING & MERGING --- //

    //Alphabetize the geojson
    res[0].features.sort((a, b) => {
      const bleep = a.properties.name;
      const bloop = b.properties.name;
      if (bleep > bloop) return 1;
      if (bleep < bloop) return -1;
      else return 0;
    });

    //Add the points to the geojson
    res[0].features.forEach((c) => {
      const countyPoints = res[2].filter((p) => c.properties.name === p.County);
      c.points = countyPoints;
    });
    // console.log(`res[0]: ${res[0].features}`);
    // --- CREATING SVG --- ///

    // Overall group for elements
    const map = svg.append("g");

    map.append("g").attr("class", "counties");

    const countiesLayer = d3.selectAll(".counties");
    countiesLayer.attr("stroke", "white");
    countiesLayer.attr("fill-opacity", 0.8);
    const countiesContainer = svg.append("g").attr("class", "poppedOut");

    // Add Counties
    countiesLayer
      .selectAll("g")
      .data(res[0].features)
      .enter()
      .append("g") // Add a group for each county
      .attr("class", (d) => `county ${d.properties.name.replace(/ /g, "_")}`)
      .append("path") // Draw shape for each county
      .attr("class", (d) => {
        let demo = res[1].find((e) => e.county === d.properties.name);
        return `shape ${coloring(demo?.cover) || ""}${
          tilling(demo?.till) || ""
        }`;
      })
      .attr("fill-opacity", 0)
      .attr("d", path)
      .on("click", clicked);

    const countySelect = d3.selectAll(".county");

    //tool tip div
    var tooltip = d3
      .select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

    // Add Points to Counties
    countySelect
      .append("g")
      .attr("class", (d) => `points ${d.properties.name.replace(/ /g, "_")}`)
      .attr("fill-opacity", 0)
      .attr("display", "none")
      .selectAll("path")
      .data((d) => d.points)
      .enter()
      .append("circle")
      .attr("r", 3)
      .attr("class", "point")
      .attr("cx", (d) => projection([d.Long, d.Lat])[0])
      .attr("cy", (d) => projection([d.Long, d.Lat])[1])
      .on("mouseover", (event, z) => {
        d3.select(this).classed("selected", true);
        tooltip.transition().duration(200).style("opacity", 1);

        tooltip
          .html(`<h3>${z.Name}</h3> <hr/> ${z.Details}`)
          .style("left", event.pageX + "px")
          .style("top", event.pageY - 28 + "px");
      })
      .on("mouseout", (d) => {
        d3.select(this).classed("selected", false);
        tooltip.transition().duration(500).style("opacity", 0);
      });

    map.append("g").attr("class", "flowers");

    const flowersLayer = d3.select(".flowers");
    flowersLayer.attr("stroke", "black");
    flowersLayer.attr("stroke-opacity", 0);
    flowersLayer.attr("stroke-weight", 1);
    flowersLayer.attr("fill-opacity", 0);

    // Creates flowers with petals
    flowersLayer
      .selectAll("g")
      .data(res[1])
      .enter()
      .append("g")
      .attr("pointer-events", "none")
      .attr("class", (d) => `flower ${d.county.replace(/ /g, "_")}`)
      .attr(
        "transform",
        (d) => `translate(${d.xPos} ${d.yPos}), scale(${d.petSize})`
      )
      .attr("fill", (d) => d3.interpolateMagma(d.colors))
      .selectAll("path")
      .data((d) => d.petals)
      .enter()
      .append("path")
      .attr("class", "petal")
      .attr("d", (d) => d.petalPath)
      .attr("transform", (d) => `rotate(${d.angle})`);

    const flowerSelect = d3.selectAll(".flower");

    // Add flower centers
    flowerSelect
      .append("circle")
      .attr("fill", "white")
      .attr("stroke", "none")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", 20);

    //Trigger Functions
    function shapeStroke() {
      countiesLayer
        //add
        .transition()
        .duration(750)
        .attr("stroke", "white")
        //subtract
        .attr("fill-opacity", 0);
      flowersLayer.attr("stroke-opacity", 0).attr("fill-opacity", 0);
    }
    //texture only
    function shapeTexture() {
      //add
      d3.selectAll(".shape").classed("tex", true);

      d3.selectAll(".shape")
        .transition()
        .duration(750)
        .attr("fill-opacity", 0.9);
      //subtract
      flowersLayer.transition().duration(750).attr("stroke-opacity", "0");
    }
    //texture and color
    function shapeColor() {
      d3.selectAll(".shape").classed("tex", false);
      //add
      d3.selectAll(".shape").transition().duration(750).attr("fill-opacity", 1);
      //subtract
      flowersLayer.transition().duration(750).attr("stroke-opacity", "0");
    }

    function flowerStroke() {
      flowersLayer
        //add
        .transition()
        .duration(850)
        .attr("stroke-opacity", "1")
        .attr("stroke-width", "5")
        // subtract
        .attr("fill-opacity", 0);
    }

    function flowerColor() {
      flowersLayer
        //add
        .transition()
        .duration(750)
        .attr("fill-opacity", 1)
        //subtract
        .attr("stroke-opacity", 0);
    }
    scrollTriggers.addTrigger("Trigger0", 20, shapeTexture);
    //scrollTriggers.addTrigger("Trigger1", 20, shapeStroke);
    scrollTriggers.addTrigger("Trigger2", 20, shapeColor);
    scrollTriggers.addTrigger("Trigger3", 20, flowerStroke);
    scrollTriggers.addTrigger("Trigger4", 20, flowerColor);

    function clicked(e, d) {
      console.log(d);

      // tool tip
      var hover = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .style("opacity", 0);

      //console.log(d.properties.name)
      const county = d3.select(
        `.county.${d.properties.name.replace(/ /g, "_")}`
      );
      const countyGroup = county.node();

      const { x, y, width, height } = countyGroup.getBBox(); //returns rectangle (center, width, height)
      county
        .attr("transform-origin", `${x + width / 2}px ${y + height / 2}px`)
        .remove();

      // //.remove() and .append() removes it from OG map and moves it to container
      d.properties.expanded = !d.properties.expanded;
      d.properties.expanded
        ? countiesContainer.append(() => county.node())
        : countiesLayer.append(() => county.node());

      // add points for the selected county
      let currentPts = d3.select(
        `.points.${d.properties.name.replace(/ /g, "_")}`
      );

      currentPts
        .transition()
        .duration(100)
        .attr("fill-opacity", d.properties.expanded ? 1 : 0)
        .attr("display", d.properties.expanded ? "block" : "none");
      //.attr("display", d.properties.expanded ? "block" : "none")

      // //Adds transition and sets size * 5 of original and back to OG when clicked again
      county
        .transition()
        .duration(100)
        .attr(
          "transform",
          d.properties.expanded
            ? `translate(${450 - (x + width / 2)} ${
                350 - (y + height / 2)
              }) scale(5)`
            : "scale(1)"
        )
        .attr("stroke", d.properties.expanded ? "none" : "white")
        .attr("stroke-width", d.properties.expanded ? 0 : 10);
    }
  }
);
