(function () {
  // --- VARIABILI E STATO PRIVATI ---
  const years = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016];
  let selectedYear = 2016;
  let selectedCountryForChart = "Italy"; // Stato predefinito per il grafico a linee
  let incidentsData = {}; // Struttura: { "Iceland": { 2016: 12, 2017: 5, ... } }
  let lawsData = {};      // Struttura: { "Albania": [ { year: 2013, type: "Hate Crime Law", title: "Criminal Code", color: "#ef4444" }, ... ] }
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

  // Proiezione ingrandita (.scale(780)) e centrata sull'Europa
  const projection = d3.geoAzimuthalEqualArea()
    .rotate([-10, -52, 0])
    .scale(780)
    .translate([width / 2, height / 2 + 30]);

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

  // --- CARICAMENTO DATI E RENDERING MAPPA (MODIFICATO CON PROMISE PER 2 CSV) ---
  Promise.all([
    d3.csv("data/DS5/hate_crimes.csv"),
    d3.csv("data/DS6/laws_against_lgbtq_hate_crimes.csv"), // <-- AGGIUNTO: Percorso del CSV delle leggi
    d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
  ]).then(([rawCsvIncidents, rawCsvLaws, geoData]) => {

    processIncidentsCSV(rawCsvIncidents);
    processLawsCSV(rawCsvLaws); // <-- AGGIUNTO: Parser per le leggi
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
    console.error("Errore nel caricamento dei file:", err);
  });

  // --- PARSER NUOVO CSV DELLE LEGGI ---
  function processLawsCSV(data) {
    data.forEach(row => {
      const country = (row["Country"] || "").trim();
      if (!country) return;

      if (!lawsData[country]) lawsData[country] = [];

      // Hate Crime Law (Rosso)
      const crimeYear = parseInt(row["Hate crime law"], 10);
      if (!isNaN(crimeYear)) {
        lawsData[country].push({
          year: crimeYear,
          type: "Hate Crime Law",
          title: row["Hate crime law name"] || "Legge contro crimini d'odio",
          color: "#ef4444"
        });
      }

      // Hate Speech Law (Arancione)
      const speechYear = parseInt(row["Hate speech law"], 10);
      if (!isNaN(speechYear)) {
        lawsData[country].push({
          year: speechYear,
          type: "Hate Speech Law",
          title: row["Hate Speech law name"] || "Legge sul discorso d'odio",
          color: "#f59e0b"
        });
      }
    });
  }

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

  // --- RENDERING GRAFICO A LINEE CON SELETTORE E LEGGI (MODIFICATO) ---
  function renderLineChart() {
    const container = d3.select("#incidents-linechart-container");
    if (container.empty()) return;
    container.html("");

    const countriesList = Object.keys(incidentsData).sort();
    if (countriesList.length === 0) return;

    if (!countriesList.includes(selectedCountryForChart)) {
      selectedCountryForChart = countriesList[0];
    }

    // 1. DROPDOWN SELEZIONE PAESE
    const selectorContainer = container.append("div")
      .style("margin-bottom", "15px")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "10px");

    selectorContainer.append("label")
      .attr("for", "country-select")
      .style("font-weight", "bold")
      .text("Seleziona Stato:");

    const select = selectorContainer.append("select")
      .attr("id", "country-select")
      .style("padding", "6px 12px")
      .style("border-radius", "4px")
      .style("border", "1px solid #ccc")
      .style("font-size", "14px");

    select.selectAll("option")
      .data(countriesList)
      .enter()
      .append("option")
      .attr("value", d => d)
      .property("selected", d => d === selectedCountryForChart)
      .text(d => d);

    select.on("change", function () {
      selectedCountryForChart = this.value;
      renderLineChart();
    });

    // 2. DIMENSIONI E SVG
    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const containerWidth = container.node().getBoundingClientRect().width || 800;
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = 400 - margin.top - margin.bottom;

    const svgChart = container.append("svg")
      .attr("width", chartWidth + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const sortedYears = years.slice().sort((a, b) => a - b);

    const countrySeries = sortedYears.map(yr => ({
      year: yr,
      count: incidentsData[selectedCountryForChart]?.[yr] || 0
    }));

    // 3. SCALE E ASSI
    const x = d3.scalePoint()
      .domain(sortedYears)
      .range([0, chartWidth]);

    const maxVal = d3.max(countrySeries, d => d.count) || 10;

    const y = d3.scaleLinear()
      .domain([0, maxVal * 1.15])
      .range([chartHeight, 0])
      .nice();

    svgChart.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .style("font-size", "12px");

    svgChart.append("g")
      .call(d3.axisLeft(y).ticks(6))
      .style("font-size", "12px");

    // 4. LINEA INCIDENTI
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svgChart.append("path")
      .datum(countrySeries)
      .attr("fill", "none")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 3)
      .attr("d", line);

    // 5. PUNTI SULLA LINEA
    svgChart.selectAll(".data-dot")
      .data(countrySeries)
      .enter()
      .append("circle")
      .attr("class", "data-dot")
      .attr("cx", d => x(d.year))
      .attr("cy", d => y(d.count))
      .attr("r", 5)
      .attr("fill", "#6366f1")
      .style("cursor", "pointer")
      .on("mouseover", function (event, d) {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`<strong>${selectedCountryForChart} (${d.year})</strong>: ${d.count} incidenti`)
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.transition().duration(200).style("opacity", 0);
      });

    // 6. SOVRAPPOSIZIONE MARCATORI LEGGI (PROVVEDIMENTI)
    const countryLaws = lawsData[selectedCountryForChart] || [];

    countryLaws.forEach((law, idx) => {
      if (!sortedYears.includes(law.year)) return; // Disegna solo se rientra nel range di anni del grafico (2016-2023)

      const xPos = x(law.year);
      const yOffset = 15 + (idx % 2) * 22; // Sfalsa se ci sono più leggi nello stesso anno

      // Linea verticale tratteggiata
      svgChart.append("line")
        .attr("x1", xPos)
        .attr("y1", 0)
        .attr("x2", xPos)
        .attr("y2", chartHeight)
        .attr("stroke", law.color)
        .attr("stroke-width", 1.8)
        .attr("stroke-dasharray", "4,4");

      // Badge con simbolo §
      const badge = svgChart.append("g")
        .attr("transform", `translate(${xPos}, ${yOffset})`)
        .style("cursor", "pointer");

      badge.append("circle")
        .attr("r", 9)
        .attr("fill", law.color);

      badge.append("text")
        .attr("text-anchor", "middle")
        .attr("dy", "3px")
        .attr("fill", "#ffffff")
        .style("font-size", "9px")
        .style("font-weight", "bold")
        .text("§");

      // Tooltip al passaggio del mouse
      badge.on("mouseover", function (event) {
        tooltip.transition().duration(100).style("opacity", 1);
        tooltip.html(`
          <div style="max-width: 220px;">
            <strong style="color: ${law.color};">${law.type} (${law.year})</strong><br/>
            <strong>${law.title}</strong>
          </div>
        `)
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      }).on("mouseout", function () {
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