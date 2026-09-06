// Anni supportati dalla timeline
const years = [
  2024, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 
  2009, 2008, 2007, 2006, 2005, 2004, 2003, 2001, 
  2000, 1999, 1989
];

let selectedYear = 1989;
let currentTopic = 'marriage'; // 'marriage' o 'adoption'
let selectedCountryCode = null;
let selectedCountryName = null;

// Strutture dati globali
let normalizedData = {}; // { CountryName: { Year: { ...dettagli... } } }
let countryNameToId = {};  // Mappatura Nomi paesi -> Codici ISO Numerici per D3

// Mappatura nomi paesi CSV -> Codici ISO 3166-1 Numeric usati da TopoJSON
const countryIsoMapping = {
  "Albania": "008", "Andorra": "020", "Austria": "040", "Belarus": "112",
  "Belgium": "056", "Bosnia and Herzegovina": "070", "Bulgaria": "100",
  "Croatia": "191", "Cyprus": "196", "Czech Republic": "203", "Czechia": "203",
  "Denmark": "208", "Estonia": "233", "Finland": "246", "France": "250",
  "Germany": "276", "Greece": "300", "Hungary": "348", "Iceland": "352",
  "Ireland": "372", "Italy": "380", "Latvia": "428", "Liechtenstein": "438",
  "Lithuania": "440", "Luxembourg": "442", "Malta": "470", "Moldova": "498",
  "Monaco": "492", "Montenegro": "499", "Netherlands": "528", "North Macedonia": "807",
  "Norway": "578", "Poland": "616", "Portugal": "620", "Romania": "642",
  "Russia": "643", "San Marino": "674", "Serbia": "688", "Slovakia": "703",
  "Slovenia": "705", "Spain": "724", "Sweden": "752", "Switzerland": "756",
  "Turkey": "792", "Ukraine": "804", "United Kingdom": "826"
};

// Helper per ripulire i nomi dei paesi nei CSV (es. "Austria (a)" -> "Austria")
function cleanCountryName(name) {
  if (!name) return "";
  return name.replace(/\s*\([a-z0-9]+\)/gi, "").trim();
}

// Helper per convertire Yes/No/1/0 in Booleani
function parseBoolean(value) {
  if (value === null || value === undefined) return false;
  const str = String(value).trim().toLowerCase();
  return str === 'yes' || str === '1' || str === 'true';
}

// Inizializzazione visiva della Timeline
function initTimeline() {
  const yearsContainer = document.getElementById('years-list');
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

// Configurazione SVG e Proiezione D3
const width = 900;
const height = 600;

const svg = d3.select("#map-container")
  .append("svg")
  .attr("viewBox", `0 0 ${width} ${height}`)
  .attr("width", "100%")
  .attr("height", "100%");

const projection = d3.geoAzimuthalEqualArea()
  .rotate([-10, -52, 0])
  .scale(780)
  .translate([width / 2 + 80, height / 2 + 30]);

const path = d3.geoPath().projection(projection);

// Caricamento HTTP nativo dei file CSV e del file Geografico TopoJSON
Promise.all([
  d3.csv("data/DS4/marriage_and_parenting_1989_2016.csv"),
  d3.csv("data/DS3/marriage_and_parenting_2024.csv"),
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json")
]).then(([data1989_2016, data2024, geoData]) => {
  
  processCSVData(data1989_2016, data2024);
  initTimeline();

  const countries = topojson.feature(geoData, geoData.objects.countries);

  // Renderizza la mappa europea
  svg.selectAll("path")
    .data(countries.features)
    .enter()
    .append("path")
    .attr("d", path)
    .attr("id", d => `country-${d.id}`)
    .attr("class", "country-path")
    .style("fill", "#FFFFFF")
    .on("click", (event, d) => {
      const countryName = Object.keys(countryIsoMapping).find(
        key => countryIsoMapping[key] === String(d.id).padStart(3, '0')
      );
      
      if (countryName) {
        selectedCountryCode = d.id;
        selectedCountryName = countryName;
        
        // Evidenzia visivamente lo stato selezionato
        svg.selectAll("path").classed("selected", false);
        d3.select(event.currentTarget).classed("selected", true);

        renderDetailSection();
      }
    });

  setYear(1989);
}).catch(error => {
  console.error("Errore nel caricamento dei dati di rete:", error);
});

// Elaborazione e Normalizzazione dei Dati CSV
function processCSVData(data1989_2016, data2024) {
  // 1. Dati 1989-2016
  data1989_2016.forEach(row => {
    const rawCountry = row["Jurisdiction"] || row["Country"];
    const country = cleanCountryName(rawCountry);
    const year = parseInt(row["Year"]);

    if (!country || isNaN(year)) return;

    if (!normalizedData[country]) normalizedData[country] = {};

    normalizedData[country][year] = {
      marriage_same_sex: parseBoolean(row["Marriage same-sex"]),
      registered_partnership: parseBoolean(row["Registered partnership same-sex"]),
      cohabitation: parseBoolean(row["Cohabitation same-sex"]),
      adoption_marriage: parseBoolean(row["Adoption for married same-sex couple"]),
      adoption_partnership: parseBoolean(row["Adoption for registered partenership same-sex"]),
      adoption_cohabitation: parseBoolean(row["Adoption for same.-sex couple that cohabiate"])
    };
  });

  // 2. Dati 2024
  data2024.forEach(row => {
    const rawCountry = row["Country"] || row["Jurisdiction"];
    const country = cleanCountryName(rawCountry);
    
    if (!country) return;

    if (!normalizedData[country]) normalizedData[country] = {};

    normalizedData[country][2024] = {
      marriage_same_sex: parseBoolean(row["Marriage equality"]),
      registered_partnership: parseBoolean(row["Registered partnership (similar rights to marriage)"]) || parseBoolean(row["Registered partnership (limited rigths)"]),
      cohabitation: parseBoolean(row["Cohabitation"]),
      adoption_marriage: parseBoolean(row["Joint adoption"]),
      adoption_partnership: parseBoolean(row["Second-parent adoption"]),
      adoption_cohabitation: parseBoolean(row["Automatic co-parent recognition"])
    };
  });

  Object.keys(countryIsoMapping).forEach(name => {
    countryNameToId[name] = countryIsoMapping[name];
  });
}

// Calcolo della tonalità di colore in base ai diritti concessi
function CalculateColor(countryName, year, topic) {
  const countryHistory = normalizedData[countryName];
  if (!countryHistory) return "#f2f2f2"; // Grigio (No Data)

  const availableYears = Object.keys(countryHistory).map(Number).sort((a, b) => a - b);
  const activeYear = availableYears.filter(y => y <= year).pop();

  if (!activeYear) return "#f2f2f2";

  const details = countryHistory[activeYear];

  if (topic === 'marriage') {
    if (details.marriage_same_sex && details.adoption_marriage) {
      return "#25e575"; // Verde acceso (Piena eguaglianza)
    }

    let passed = 0;
    let total = 3;
    if (details.marriage_same_sex) passed++;
    if (details.registered_partnership) passed++;
    if (details.cohabitation) passed++;

    const ratio = passed / total;
    if (ratio === 0) return "#E74C3C"; // Rosso
    if (ratio <= 0.34) return "#E67E22"; // Rosso-Arancio
    return "#F39C12"; // Arancio
  } 
  else {
    if (details.adoption_marriage && details.marriage_same_sex) {
      return "#25e575"; // Verde acceso
    }

    let passed = 0;
    let total = 3;
    if (details.adoption_marriage) passed++;
    if (details.adoption_partnership) passed++;
    if (details.adoption_cohabitation) passed++;

    const ratio = passed / total;
    if (ratio === 0) return "#E74C3C"; 
    if (ratio <= 0.34) return "#E67E22"; 
    return "#F39C12"; 
  }
}

// Aggiorna i colori della mappa
function updateMapColors() {
  svg.selectAll("path").style("fill", d => {
    const isoCode = String(d.id).padStart(3, '0');
    const countryName = Object.keys(countryIsoMapping).find(
      key => countryIsoMapping[key] === isoCode
    );

    if (!countryName) return "#FFFFFF";

    return CalculateColor(countryName, selectedYear, currentTopic);
  });
}

// Imposta l'anno attivo
function setYear(year) {
  selectedYear = year;
  
  const yearItems = document.querySelectorAll('.year-item');
  let selectedIndex = 0;

  yearItems.forEach((el, index) => {
    if (parseInt(el.dataset.year) === year) {
      el.classList.add('active');
      selectedIndex = index;
    } else {
      el.classList.remove('active');
    }
  });

  const trackContainer = document.querySelector('.timeline-track');
  if (trackContainer) {
    const trackHeight = trackContainer.clientHeight;
    const step = trackHeight / (years.length - 1);
    const thumbTop = selectedIndex * step;
    
    const thumb = document.getElementById('slider-thumb');
    if (thumb) thumb.style.top = `${thumbTop}px`;
  }

  updateMapColors();
  if (selectedCountryName) {
    renderDetailSection();
  }
}

// Imposta il tema attivo (marriage / adoption)
function setTopic(topic) {
  currentTopic = topic;
  
  const btnMarriage = document.getElementById('btn-marriage');
  const btnAdoption = document.getElementById('btn-adoption');

  if (btnMarriage) btnMarriage.className = topic === 'marriage' ? 'tab-btn active' : 'tab-btn inactive';
  if (btnAdoption) btnAdoption.className = topic === 'adoption' ? 'tab-btn active' : 'tab-btn inactive';
  
  updateMapColors();
  if (selectedCountryName) {
    renderDetailSection();
  }
}

// Renderizza il pannello dettagli sotto la mappa
function renderDetailSection() {
  const container = document.getElementById('details-section');
  if (!container) return;

  if (!selectedCountryName) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';

  const countryHistory = normalizedData[selectedCountryName];
  let details = null;

  if (countryHistory) {
    const availableYears = Object.keys(countryHistory).map(Number).sort((a, b) => a - b);
    const activeYear = availableYears.filter(y => y <= selectedYear).pop();
    if (activeYear) details = countryHistory[activeYear];
  }

  const items = [
    { label: "Marriage Equality", active: details ? details.marriage_same_sex : false },
    { label: "Registered Partnership", active: details ? details.registered_partnership : false },
    { label: "Cohabitation", active: details ? details.cohabitation : false },
    { label: "Adoption - Marriage", active: details ? details.adoption_marriage : false },
    { label: "Adoption - Partnership", active: details ? details.adoption_partnership : false },
    { label: "Adoption - Cohabitation", active: details ? details.adoption_cohabitation : false }
  ];

  let html = `
    <div class="details-header">${selectedCountryName}, ${selectedYear}</div>
    <div class="details-grid">
  `;

  items.forEach(item => {
    const statusClass = item.active ? 'granted' : 'not-granted';
    
    // Se è concesso usa un simbolo/icona verde, altrimenti usa la tua immagine Flaticon
    const iconMarkup = item.active 
      ? `<img src="assets/icon-yes.png" alt="Not granted" class="badge-icon-img" />>` 
      : `<img src="assets/icon-no.png" alt="Not granted" class="badge-icon-img" />`;

    html += `
      <div class="detail-badge ${statusClass}">
        <span>${item.label}</span>
        <div class="badge-icon-wrapper">
          ${iconMarkup}
        </div>
      </div>
    `;
  });

  html += `</div>`;
  container.innerHTML = html;
}