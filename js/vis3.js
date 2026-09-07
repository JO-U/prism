(function () {
  // --- VARIABILI E STATO PRIVATI ---
  const years = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
  let selectedYear = 2016;
  let incidentsData = {}; // Struttura: { "Iceland": { 2016: 12, 2017: 5, ... } }
  let colorScale;

  const countryIsoMapping = {
    "Albania": "008", "Andorra": "020", "Austria": "040", "Belarus": "112",
    "Belgium": "056", "Bosnia and Herzegovina": "070", "Bulgaria": "100",
    "Croatia": "191", "Cyprus": "196", "Czech Republic": "203", "Czechia": "203",
    "Denmark": "208", "Estonia": "233", "Finland": "246", "France": "250",
    "Germany": "276", "Greece": "300", "Hungary": "348", "Iceland": "352",
    "Ireland": "372", "Italy": "380", "Latvia": "428", "Liechtenstein": "438",
    "Lithuania": "440", "Luxembourg": "442", "Malta": "470", "Moldova": "498",
    "Monaco": "492", "Montenegro": "499", "Netherlands": "528", "North Macedonia": "807",
    "Norway": "578", "Poland": "616", "Portugal": "620", "Romania": "642", "San Marino": "674", "Serbia": "688", "Slovakia": "703",
    "Slovenia": "705", "Spain": "724", "Sweden": "752", "Switzerland": "756",
    "Turkey": "792", "Ukraine": "804", "United Kingdom": "826"
  };

  const tooltip = d3.select("#incidents-tooltip");

  // --- DIMENSIONI MAPPA & PROIEZIONE D3 ---
  const width = 900;
  const height = 500;

  const svgMap = d3.select("#incidents-map-container")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("width", "100%")
    .style("height", "100%")
    .style("display", "block");

  // Proiezione ingrandita (.scale(1100)) e centrata sull'Europa
  const projection = d3.geoAzimuthalEqualArea()
    .rotate([-10, -52, 0])
    .scale(780)
    .translate([width / 2, height / 2+30]);

  const path = d3.geoPath().projection(projection);

  // --- GESTIONE DELLE SCHEDE/TAB ---
  function initTabs() {
    const btnMap = document.getElementById('tab-map-timeline');
    const btnChart = document.getElementById('tab-incidents-country');

    const viewMap = document.getElementById('view-map-timeline');
    const viewChart = document.getElementById('view-incidents-chart');

    if (!btnMap || !btnChart) return;

    btnMap.addEventListener('click', () => {
      btnMap.className = 'vis2-tab-btn active';
      btnChart.className = 'vis2-tab-btn inactive';
      if (viewMap) viewMap.style.display = 'block';
      if (viewChart) viewChart.style.display = 'none';
    });

    btnChart.addEventListener('click', () => {
      btnChart.className = 'vis2-tab-btn active';
      btnMap.className = 'vis2-tab-btn inactive';
      if (viewMap) viewMap.style.display = 'none';
      if (viewChart) viewChart.style.display = 'block';

      renderLineChart();
    });
  }

  // --- CONFIGURAZIONE SCALA COLORI (Giallo -> Arancione -> Rosso) ---
  function setupColorScale() {
    let maxCount = 0;

    Object.keys(incidentsData).forEach(country => {
      Object.keys(incidentsData[country]).forEach(yr => {
        const count = incidentsData[country][yr];
        if (count > maxCount) maxCount = count;
      });
    });

    if (maxCount === 0) maxCount = 50;

    colorScale = d3.scaleSequential()
      .domain([1, maxCount])
      .interpolator(d3.interpolateYlOrRd);
  }

  // --- CARICAMENTO DATI E RENDERING MAPPA ---
  Promise.all([
    d3.csv("data/DS5/hate_crimes.csv"),
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
  ]).then(([rawCsv, geoData]) => {

    processIncidentsCSV(rawCsv);
    setupColorScale();
    initTimeline();
    initTabs();

    const countries = topojson.feature(geoData, geoData.objects.countries);

    svgMap.selectAll("path")
      .data(countries.features)
      .enter()
      .append("path")
      .attr("d", path)
      .attr("id", d => `incidents-country-${d.id}`)
      .attr("class", "incidents-country-path")
      .style("stroke", "#B0B0B0")
      .style("stroke-width", "0.8px")
      .each(function (d) {
        this.style.fill = getIncidentColor(d.id);
      })
      .on("mouseover", function (event, d) {
        const countryName = getCountryNameByIso(d.id);
        if (!countryName) return;

        const count = getIncidentCount(countryName, selectedYear);

        d3.select(this)
          .style("stroke", "#111111")
          .style("stroke-width", "1.8px")
          .style("cursor", "pointer");

        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`<strong>${countryName}</strong>: ${count} incidenti`)
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mousemove", function (event) {
        tooltip
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        d3.select(this)
          .style("stroke", "#B0B0B0")
          .style("stroke-width", "0.8px");

        tooltip.transition().duration(200).style("opacity", 0);
      });

    setYear(selectedYear);
  }).catch(err => {
    console.error("Errore nel caricamento della Mappa 2:", err);
  });

  // --- AGGIORNAMENTO COLORE DELLA MAPPA IN BASE ALL'ANNO ---
  function updateMapFill() {
    svgMap.selectAll("path").each(function (d) {
      this.style.fill = getIncidentColor(d.id);
    });
  }

  function getIncidentColor(isoId) {
    const countryName = getCountryNameByIso(isoId);
    if (!countryName) return "#f0f0f0";

    const count = getIncidentCount(countryName, selectedYear);
    if (count === 0) return "#25e575";

    return colorScale(count);
  }

  // --- RENDERING GRAFICO A LINEE (INCIDENTS PER COUNTRY) ---
  function renderLineChart() {
    const container = d3.select("#incidents-linechart-container");
    if (container.empty()) return;
    container.html("");

    const margin = { top: 30, right: 120, bottom: 40, left: 50 };
    const containerWidth = container.node().getBoundingClientRect().width || 800;
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = 400 - margin.top - margin.bottom;

    const svgChart = container.append("svg")
      .attr("width", chartWidth + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const sortedYears = years.slice().sort((a, b) => a - b);

    const x = d3.scalePoint()
      .domain(sortedYears)
      .range([0, chartWidth]);

    let maxIncidents = 0;
    Object.keys(incidentsData).forEach(country => {
      sortedYears.forEach(y => {
        if (incidentsData[country][y] > maxIncidents) {
          maxIncidents = incidentsData[country][y];
        }
      });
    });

    const y = d3.scaleLinear()
      .domain([0, maxIncidents || 10])
      .range([chartHeight, 0])
      .nice();

    svgChart.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .attr("color", "#666");

    svgChart.append("g")
      .call(d3.axisLeft(y).ticks(5))
      .attr("color", "#666");

    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    const countriesList = Object.keys(incidentsData);
    const palette = d3.scaleOrdinal(d3.schemeCategory10);

    countriesList.forEach((country, index) => {
      const countrySeries = sortedYears.map(yr => ({
        year: yr,
        count: incidentsData[country][yr] || 0
      }));

      svgChart.append("path")
        .datum(countrySeries)
        .attr("fill", "none")
        .attr("stroke", palette(index))
        .attr("stroke-width", 2)
        .attr("d", line);

      svgChart.selectAll(`.dot-${index}`)
        .data(countrySeries)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.year))
        .attr("cy", d => y(d.count))
        .attr("r", 4)
        .attr("fill", palette(index))
        .on("mouseover", function (event, d) {
          tooltip.transition().duration(100).style("opacity", 1);
          tooltip.html(`<strong>${country}</strong> (${d.year}): ${d.count} incidenti`)
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(200).style("opacity", 0);
        });
    });
  }

  // --- FUNZIONI HELPER ---
  function processIncidentsCSV(data) {
    data.forEach(row => {
      const country = (row["Country"] || row["Jurisdiction"] || row["country_name"] || "").trim();

      if (!country) return;
      if (!incidentsData[country]) incidentsData[country] = {};

      years.forEach(year => {
        const value = Number.parseInt(row[String(year)], 10);
        incidentsData[country][year] = Number.isNaN(value) ? 0 : value;
      });
    });
  }

  function getCountryNameByIso(isoId) {
    const isoCode = String(isoId).padStart(3, '0');
    return Object.keys(countryIsoMapping).find(key => countryIsoMapping[key] === isoCode);
  }

  function getIncidentCount(countryName, year) {
    return (incidentsData[countryName] && incidentsData[countryName][year] !== undefined)
      ? incidentsData[countryName][year]
      : 0;
  }

  function initTimeline() {
    const yearsContainer = document.getElementById('incidents-years-list');
    if (!yearsContainer) return;
    yearsContainer.innerHTML = '';

    years.forEach(year => {
      const yearEl = document.createElement('div');
      yearEl.classList.add('year-item');
      if (year === selectedYear) yearEl.classList.add('active');
      yearEl.innerText = year;
      yearEl.dataset.year = year;

      yearEl.addEventListener('click', () => setYear(year));
      yearsContainer.appendChild(yearEl);
    });
  }

  function setYear(year) {
    selectedYear = year;
    const yearItems = document.querySelectorAll('#incidents-years-list .year-item');
    let selectedIndex = 0;

    yearItems.forEach((el, index) => {
      if (parseInt(el.dataset.year) === year) {
        el.classList.add('active');
        selectedIndex = index;
      } else {
        el.classList.remove('active');
      }
    });

    const thumb = document.getElementById('incidents-slider-thumb');
    if (thumb) {
      const step = 280 / (years.length - 1);
      thumb.style.top = `${selectedIndex * step}px`;
    }

    updateMapFill();
  }

})();