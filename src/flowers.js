import * as d3 from "d3";

// --- GLOBAL ---
export const petalPath =
  "M6.8,6.1c11.6-6.4,20.4-5.9,24.6-5.2C52.8,4.5,71.1,31.5,71.9,68C35,71.7,6.3,55.2,1.3,34.3 C0.4,30.7-1.3,20.4,6.8,6.1z";

const randomPetalPath = () => {
  let c1 = Math.floor(Math.random() * 35) + 40; // 40 -> 75
  let c2 = -Math.floor(Math.random() * 17) - 10; // -27 -> -10

  return `M 6 6 q ${c2} ${c1} 68 68 Q ${c1} ${c2} 6 6`;
};

// --- FUNCTIONS ---
async function loadFlowerData() {
  // Type conversion
  function type(d) {
    return {
      county: d.County,
      pop: +d.Population,
      xPos: +d.X,
      yPos: +d.Y,
      fert: +d.FertilizerEstimates,
      CoverCrop: +d.CoverCrop,
      RegisteredEVs: +d.RegisteredEVs,
      EVs: +d.EvsByPop,
      area: +d.LandInFarms,
      noTill: +d.NoTill
    };
  }
  return d3.csv("data/CountyEnvironmentData.csv", type).then((res) => res);
}

function ready(data) {
  const numData = data.length;
  const areaMinMax = d3.extent(data, (d) => d.area);
  const noTillMinMax = d3.extent(data, (d) => d.noTill);
  const fertMinMax = d3.extent(data, (d) => d.fert); // num petals
  const sizeScale = d3.scaleLinear().domain(areaMinMax).range([0.2, 0.6]); //size mapped to energy
  const numPetalScale = d3
    .scaleQuantize()
    .domain(noTillMinMax)
    .range([5, 8, 11]); // Number mapped to co2
  const xScale = d3.scaleLinear().domain([0, numData]).range([0, 100]);
  const colorsScale = d3.scaleLinear().domain(fertMinMax).range([0.2, 1]);

  // For each county, return data
  const flowersData = data.map((d) => {
    const numPetals = numPetalScale(d.noTill);
    const petSize = sizeScale(d.area);
    const xPos = d.xPos;
    const yPos = d.yPos;
    const colors = colorsScale(d.fert);
    const county = d.county.substring(0, d.county.length - 7);
    const till = d.noTill;
    const cover = d.CoverCrop;
    const petals = Array.from(Array(numPetals), (e, i) => ({
      angle: (360 * i) / numPetals,
      petalPath: randomPetalPath()
    }));

    return {
      county,
      till,
      cover,
      petSize,
      xPos,
      yPos,
      colors,
      petals,
      numPetals
    };
  });

  return flowersData;
}

export { loadFlowerData, ready };
