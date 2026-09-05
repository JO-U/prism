// Mappatura delle domande FRA Survey III in base alla scelta dell'Eurobarometro
const fraQuestionsMap = {
    felt_12_months: [
        { id: "gen_orientation", label: "Discrimination in your country against lesbians, gays, and bisexuals" },
        { id: "gen_trans", label: "Discrimination in your country against transgender people" },
        { id: "gen_intersex", label: "Discrimination in your country against intersex people" }
    ],
    employment: [
        { id: "emp_lgb", label: "How comfortable would you feel if a colleague at work was LGB?" },
        { id: "emp_trans", label: "How comfortable would you feel if a colleague at work was transgender or intersex?" },
        { id: "emp_equal_rights", label: "Do LGB people have equal opportunities in employment?" }
    ],
    healthcare: [
        { id: "health_access", label: "How widespread is discrimination when accessing healthcare?" },
        { id: "health_comfort", label: "How comfortable would you feel with an LGBTQ+ healthcare provider?" }
    ],
    education: [
        { id: "edu_school", label: "How widespread is discrimination in school/university settings?" },
        { id: "edu_curriculum", label: "Should LGB issues be included in school educational material?" }
    ]
};

// Dizionario Mappatura Codici ISO -> Nomi Paesi Estesi
const countryNameMap = {
    "BE": "Belgium", "BG": "Bulgaria", "CZ": "Czechia", "DK": "Denmark",
    "DE": "Germany", "EE": "Estonia", "IE": "Ireland", "EL": "Greece",
    "ES": "Spain", "FR": "France", "HR": "Croatia", "IT": "Italy",
    "CY": "Cyprus", "LV": "Latvia", "LT": "Lithuania", "LU": "Luxembourg",
    "HU": "Hungary", "MT": "Malta", "NL": "Netherlands", "AT": "Austria",
    "PL": "Poland", "PT": "Portugal", "RO": "Romania", "SI": "Slovenia",
    "SK": "Slovakia", "FI": "Finland", "SE": "Sweden"
};

// Mappatura delle colonne di discrimination.csv per le 4 opzioni
const discColumnMap = {
    felt_12_months: "felt discriminated in the last 12 months",
    employment: "felt discriminated in the last 12 month in employement (looking for work or at work)",
    healthcare: "felt discriminated in the past 12 months when using healthcare or social services",
    education: "felt discriminated in the past 12 months in educational insitutions (as a student or as a parent))"
};

let globalDiscData = [];
let globalVolumeRows = [];

const localDataMap = window.PRISM_LOCAL_DATA || {};

function loadLocalCsv(filePath) {
    if (window.location.protocol === 'file:' && localDataMap[filePath]) {
        return Promise.resolve(d3.csvParse(localDataMap[filePath]));
    }
    return d3.csv(filePath);
}

function loadLocalText(filePath) {
    if (window.location.protocol === 'file:' && localDataMap[filePath]) {
        return Promise.resolve(localDataMap[filePath]);
    }
    return d3.text(filePath);
}

const fraVolumeMap = {
    gen_orientation: {
        sectionToken: "QB1.4",
        questionLabel: "Sexual orientation (for example being lesbian, gay or bisexual)",
        mode: "stacked",
        rowLabels: [
            "Very widespread",
            "Fairly widespread",
            "Fairly rare",
            "Very rare",
            "Non-existent",
            "Don't know"
        ],
        colors: ["#e5523d", "#f19047", "#79e694", "#34c759", "#336fde", "#969695"]
    },
    gen_trans: {
        sectionToken: "QB1.8",
        questionLabel: "Being transgender",
        mode: "stacked",
        rowLabels: [
            "Very widespread",
            "Fairly widespread",
            "Fairly rare",
            "Very rare",
            "Non-existent",
            "Don't know"
        ],
        colors: ["#e5523d", "#f19047", "#79e694", "#34c759", "#336fde", "#969695"]
    },
    gen_intersex: {
        sectionToken: "QB1.11",
        questionLabel: "Being intersex",
        mode: "stacked",
        rowLabels: [
            "Very widespread",
            "Fairly widespread",
            "Fairly rare",
            "Very rare",
            "Non-existent (SPONTANEOUS)",
            "Don't know"
        ],
        colors: ["#e5523d", "#f19047", "#79e694", "#34c759", "#336fde", "#969695"]
    },
    emp_lgb: {
        sectionToken: "QB12.10",
        questionLabel: "A lesbian, gay or bisexual person",
        mode: "single",
        rowLabel: "Total 'Comfortable'",
        color: "#e5523d"
    },
    emp_trans: {
        sectionToken: "QB12.11",
        questionLabel: "A transgender person or an intersex person",
        mode: "single",
        rowLabel: "Total 'Comfortable'",
        color: "#34c759"
    },
    emp_equal_rights: {
        sectionToken: "QB4",
        questionLabel: "The candidate's sexual orientation (for example being lesbian, gay or bisexual)",
        mode: "single",
        rowLabel: "The candidate's sexual orientation (for example being lesbian, gay or bisexual)",
        color: "#f19047"
    },
    healthcare: {
        sectionToken: "QB12.10",
        questionLabel: "A lesbian, gay or bisexual person",
        mode: "single",
        rowLabel: "Total 'Comfortable'",
        color: "#79e694"
    },
    education: {
        sectionToken: "QB17.2",
        questionLabel: "Sexual orientations (for example being lesbian, gay, or bisexual)",
        mode: "stacked",
        rowLabels: [
            "Totally agree",
            "Tend to agree",
            "Tend to disagree",
            "Totally disagree",
            "Don't know"
        ],
        colors: ["#e5523d", "#f19047", "#79e694", "#34c759", "#969695"]
    }
};

document.addEventListener("DOMContentLoaded", () => {
    const lgbtqSelect = document.getElementById("lgbtq-topic");
    const fraSelect = document.getElementById("public-opinion-topic");

    // Inizializza il caricamento dei dati
    Promise.all([
        loadLocalCsv("data/DS2/discrimination.csv"),
        loadLocalText("data/DS1/Discrimination in the EU_sp535_volumeA.csv")
    ]).then(([discData, volumeData]) => {
        globalDiscData = discData;
        globalVolumeRows = d3.csvParseRows(volumeData);

        // Inizializza le opzioni della seconda dropdown
        updateFraDropdown();
        // Genera il grafico iniziale per i 27 paesi
        renderCountryCharts();
    }).catch(error => {
        console.error("Errore durante il caricamento dei dati del grafico:", error);
        const container = document.getElementById("countries-chart-list");
        if (container) {
            container.innerHTML = "<p style='color:#b00020;'>Impossibile caricare i dati del grafico. Controlla i percorsi dei CSV e avvia la pagina tramite un server locale, non con file://.</p>";
        }
    });

    // Event Listeners
    lgbtqSelect.addEventListener("change", () => {
        updateFraDropdown();
        renderCountryCharts();
    });

    fraSelect.addEventListener("change", () => {
        renderCountryCharts();
    });
});

// Popola la dropdown FRA Survey III in base all'opzione Eurobarometro scelta
function updateFraDropdown() {
    const selectedLgbtq = document.getElementById("lgbtq-topic").value;
    const fraSelect = document.getElementById("public-opinion-topic");
    fraSelect.innerHTML = "";

    const options = fraQuestionsMap[selectedLgbtq] || [];
    options.forEach(opt => {
        const optionEl = document.createElement("option");
        optionEl.value = opt.id;
        optionEl.textContent = opt.label;
        fraSelect.appendChild(optionEl);
    });

    if (fraSelect.options.length > 0) {
        fraSelect.selectedIndex = 0;
    }
}

// Renderizza la lista dei 27 Paesi ordinati dal tasso più alto a quello più basso
function renderCountryCharts() {
    const lgbtqOption = document.getElementById("lgbtq-topic").value;
    const fraOption = document.getElementById("public-opinion-topic").value;
    const targetColumn = discColumnMap[lgbtqOption];
    const fraConfig = fraVolumeMap[fraOption] || fraVolumeMap.gen_orientation;
    const container = document.getElementById("countries-chart-list");
    container.innerHTML = "";

    // 1. Filtra solo i 27 paesi UE (escludendo EU27 complessivo e Paesi Extra-UE come Albania, North Macedonia, Serbia)
    const validEuCodes = Object.keys(countryNameMap);
    
    let countriesData = globalDiscData
        .filter(d => Object.values(countryNameMap).includes(d.country))
        .map(d => {
            const val = parseFloat(d[targetColumn]) || 0;
            return {
                countryName: d.country,
                lgbtqPct: val,
                isoCode: Object.keys(countryNameMap).find(key => countryNameMap[key] === d.country)
            };
        });

    // 2. Ordina dal più alto tasso di discriminazione al più basso
    countriesData.sort((a, b) => b.lgbtqPct - a.lgbtqPct);

    const volumeSeriesByCountry = getFraCountrySeries(fraConfig);
    updateFraLegend(fraConfig);

    // 3. Genera il blocco grafico per ciascun paese uno sotto l'altro
    countriesData.forEach(item => {
        const countryCard = document.createElement("div");
        countryCard.className = "country-row-card";

        // Struttura HTML della riga paese
        countryCard.innerHTML = `
            <div class="country-title">
                <h4>${item.countryName}</h4>
            </div>
            <div class="bars-wrapper">
                <!-- Barra 1: LGBTQ+ -->
                <div class="bar-row">
                    <span class="bar-label">LGBTQ+</span>
                    <div class="bar-track">
                        <div class="bar-fill-lgbtq" style="width: ${item.lgbtqPct}%;">
                            <span class="bar-val">${item.lgbtqPct}%</span>
                        </div>
                    </div>
                </div>
                <!-- Barra 2: Publ.O (Stacked) -->
                <div class="bar-row">
                    <span class="bar-label">Publ.O</span>
                    <div class="bar-track stacked-track" id="stacked-${item.isoCode}">
                        <!-- I segmenti verranno inseriti qua sotto -->
                    </div>
                </div>
            </div>
        `;
        container.appendChild(countryCard);

        // Simulazione segmenti Opinione Pubblica per il Paese (estratti dal dataset o strutturati)
        const stackedTrack = document.getElementById(`stacked-${item.isoCode}`);

        const segments = volumeSeriesByCountry[item.isoCode] || [];
        const total = segments.reduce((sum, segment) => sum + segment.value, 0);

        segments.forEach(segment => {
            const seg = document.createElement("div");
            seg.className = "bar-segment";
            const width = fraConfig.mode === "single"
                ? segment.value
                : total > 0
                    ? (segment.value / total) * 100
                    : 0;
            seg.style.width = `${width}%`;
            seg.style.backgroundColor = segment.color;
            stackedTrack.appendChild(seg);
        });
    });
}

function updateFraLegend(fraConfig) {
    const legend = document.getElementById("public-opinion-legend");
    if (!legend) {
        return;
    }

    legend.innerHTML = "";

    if (fraConfig.mode === "single") {
        const item = document.createElement("div");
        item.className = "legend-left";
        item.innerHTML = `<span class="legend-box" style="background-color: ${fraConfig.color};"></span><span class="legend-label">Public opinion</span>`;
        legend.appendChild(item);
        return;
    }

    fraConfig.rowLabels.forEach((label, index) => {
        const item = document.createElement("div");
        item.className = "legend-left";
        item.innerHTML = `<span class="legend-box" style="background-color: ${fraConfig.colors[index]};"></span><span class="legend-label">${label}</span>`;
        legend.appendChild(item);
    });
}

function getFraCountrySeries(fraConfig) {
    const seriesByCountry = {};
    const sectionIndex = findFraSectionIndex(fraConfig.sectionToken, fraConfig.questionLabel);

    if (sectionIndex < 0 || !globalVolumeRows.length) {
        return seriesByCountry;
    }

    const headerIndex = findFraCountryHeaderIndex(sectionIndex);

    if (headerIndex < 0) {
        return seriesByCountry;
    }

    const headerRow = globalVolumeRows[headerIndex];
    const countryColumnIndex = {};

    Object.keys(countryNameMap).forEach(code => {
        const index = headerRow.indexOf(code);
        if (index >= 0) {
            countryColumnIndex[code] = index;
        }
    });

    if (fraConfig.mode === "single") {
        const rowIndex = findFraRowIndex(headerIndex, fraConfig.rowLabel);
        if (rowIndex < 0) {
            return seriesByCountry;
        }

        const row = globalVolumeRows[rowIndex];
        Object.entries(countryColumnIndex).forEach(([code, index]) => {
            seriesByCountry[code] = [{
                label: fraConfig.rowLabel,
                value: parsePercentCell(row[index]),
                color: fraConfig.color
            }];
        });
        return seriesByCountry;
    }

    fraConfig.rowLabels.forEach((label, labelIndex) => {
        const rowIndex = findFraRowIndex(headerIndex, label);
        if (rowIndex < 0) {
            return;
        }

        const row = globalVolumeRows[rowIndex];
        Object.entries(countryColumnIndex).forEach(([code, index]) => {
            if (!seriesByCountry[code]) {
                seriesByCountry[code] = [];
            }

            seriesByCountry[code].push({
                label,
                value: parsePercentCell(row[index]),
                color: fraConfig.colors[labelIndex]
            });
        });
    });

    return seriesByCountry;
}

function findFraSectionIndex(sectionToken, questionLabel) {
    return globalVolumeRows.findIndex(row => {
        const normalizedQuestion = questionLabel.toLowerCase();
        return row.some(cell => cell && cell.toLowerCase().includes(normalizedQuestion));
    });
}

function findFraCountryHeaderIndex(startIndex) {
    return globalVolumeRows.findIndex((row, index) => {
        if (index <= startIndex) {
            return false;
        }

        return row.some(cell => typeof cell === "string" && cell.includes("UE27")) && row.includes("BE");
    });
}

function findFraRowIndex(startIndex, label) {
    return globalVolumeRows.findIndex((row, index) => {
        if (index <= startIndex) {
            return false;
        }

        const normalizedLabel = label.toLowerCase();
        return row.some(cell => typeof cell === "string" && cell.toLowerCase().includes(normalizedLabel));
    });
}

function parsePercentCell(value) {
    if (typeof value !== "string") {
        return 0;
    }

    const cleaned = value.trim().replace("%", "");
    if (!cleaned || cleaned === "-") {
        return 0;
    }

    const parsed = parseFloat(cleaned.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
}
