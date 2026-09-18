(function () {
  // --- 1. DATASET COMPLETO DAL TUO CSV DELLE LEGGI ---
  const lawsCSV = [
    { Country: "Albania", "Hate crime law": "2013", "Hate crime law name": "Criminal Code", "Hate speech law": "2013", "Hate Speech law name": "Criminal Code" },
    { Country: "Andorra", "Hate crime law": "2005", "Hate crime law name": "Penal Code", "Hate speech law": "2005", "Hate Speech law name": "Penal Code" },
    { Country: "Armenia", "Hate crime law": "2003", "Hate crime law name": "Criminal Code", "Hate speech law": "2020", "Hate Speech law name": "Criminal Code" },
    { Country: "Austria", "Hate crime law": "1974", "Hate crime law name": "Penal Code", "Hate speech law": "1974", "Hate Speech law name": "Penal Code" },
    { Country: "Azerbaijan", "Hate crime law": "1999", "Hate crime law name": "Criminal Code", "Hate speech law": "1999", "Hate Speech law name": "Criminal Code" },
    { Country: "Belarus", "Hate crime law": "1999", "Hate crime law name": "Criminal Code", "Hate speech law": "1999", "Hate Speech law name": "Criminal Code" },
    { Country: "Belgium", "Hate crime law": "1981", "Hate crime law name": "Anti-Racism Act", "Hate speech law": "1981", "Hate Speech law name": "Anti-Racism Act" },
    { Country: "Bosnia and Herzegovina", "Hate crime law": "2003", "Hate crime law name": "Criminal Code", "Hate speech law": "2003", "Hate Speech law name": "Criminal Code" },
    { Country: "Bulgaria", "Hate crime law": "1968", "Hate crime law name": "Penal Code", "Hate speech law": "1968", "Hate Speech law name": "Penal Code" },
    { Country: "Croatia", "Hate crime law": "2006", "Hate crime law name": "Penal Code", "Hate speech law": "2011", "Hate Speech law name": "Penal Code" },
    { Country: "Cyprus", "Hate crime law": "2015", "Hate crime law name": "Criminal Code", "Hate speech law": "2011", "Hate Speech law name": "Combating Racism Act" },
    { Country: "Czech Republic", "Hate crime law": "2009", "Hate crime law name": "Criminal Code", "Hate speech law": "2009", "Hate Speech law name": "Criminal Code" },
    { Country: "Denmark", "Hate crime law": "2004", "Hate crime law name": "Penal Code", "Hate speech law": "1939", "Hate Speech law name": "Penal Code § 266b" },
    { Country: "Estonia", "Hate crime law": "2001", "Hate crime law name": "Penal Code", "Hate speech law": "2001", "Hate Speech law name": "Penal Code" },
    { Country: "Finland", "Hate crime law": "2011", "Hate crime law name": "Criminal Code", "Hate speech law": "1971", "Hate Speech law name": "Criminal Code" },
    { Country: "France", "Hate crime law": "2003", "Hate crime law name": "Penal Code", "Hate speech law": "1972", "Hate Speech law name": "Press Freedom Act of 1881" },
    { Country: "Georgia", "Hate crime law": "2012", "Hate crime law name": "Criminal Code", "Hate speech law": "2014", "Hate Speech law name": "Law on Elimination of All Forms of Discrimination" },
    { Country: "Germany", "Hate crime law": "2015", "Hate crime law name": "Criminal Code § 46", "Hate speech law": "1960", "Hate Speech law name": "Criminal Code § 130 Volksverhetzung" },
    { Country: "Greece", "Hate crime law": "2008", "Hate crime law name": "Criminal Code Art. 81A", "Hate speech law": "1979", "Hate Speech law name": "Law 927/1979" },
    { Country: "Hungary", "Hate crime law": "1996", "Hate crime law name": "Criminal Code", "Hate speech law": "1993", "Hate Speech law name": "Criminal Code" },
    { Country: "Iceland", "Hate crime law": "2004", "Hate crime law name": "General Penal Code", "Hate speech law": "1940", "Hate Speech law name": "General Penal Code Art. 233a" },
    { Country: "Ireland", "Hate crime law": "1989", "Hate crime law name": "Prohibition of Incitement to Hatred Act", "Hate speech law": "1989", "Hate Speech law name": "Prohibition of Incitement to Hatred Act" },
    { Country: "Italy", "Hate crime law": "1993", "Hate crime law name": "Legge Mancino (n. 205/1993)", "Hate speech law": "1993", "Hate Speech law name": "Legge Mancino (n. 205/1993)" },
    { Country: "Latvia", "Hate crime law": "2006", "Hate crime law name": "Criminal Law", "Hate speech law": "1998", "Hate Speech law name": "Criminal Law Section 78" },
    { Country: "Liechtenstein", "Hate crime law": "1999", "Hate crime law name": "Criminal Code", "Hate speech law": "1999", "Hate Speech law name": "Criminal Code § 283" },
    { Country: "Lithuania", "Hate crime law": "2009", "Hate crime law name": "Criminal Code", "Hate speech law": "2000", "Hate Speech law name": "Criminal Code Art. 170" },
    { Country: "Luxembourg", "Hate crime law": "1997", "Hate crime law name": "Penal Code", "Hate speech law": "1997", "Hate Speech law name": "Penal Code Art. 454-457" },
    { Country: "Malta", "Hate crime law": "2002", "Hate crime law name": "Criminal Code", "Hate speech law": "2002", "Hate Speech law name": "Criminal Code Art. 82A" },
    { Country: "Moldova", "Hate crime law": "2002", "Hate crime law name": "Criminal Code", "Hate speech law": "2002", "Hate Speech law name": "Criminal Code Art. 346" },
    { Country: "Monaco", "Hate crime law": "2005", "Hate crime law name": "Penal Code", "Hate speech law": "2005", "Hate Speech law name": "Penal Code" },
    { Country: "Montenegro", "Hate crime law": "2013", "Hate crime law name": "Criminal Code", "Hate speech law": "2010", "Hate Speech law name": "Law on Prohibition of Discrimination" },
    { Country: "Netherlands", "Hate crime law": "1971", "Hate crime law name": "Penal Code", "Hate speech law": "1971", "Hate Speech law name": "Penal Code Art. 137c-e" },
    { Country: "North Macedonia", "Hate crime law": "2009", "Hate crime law name": "Criminal Code", "Hate speech law": "2014", "Hate Speech law name": "Criminal Code" },
    { Country: "Norway", "Hate crime law": "2005", "Hate crime law name": "Penal Code § 185", "Hate speech law": "1970", "Hate Speech law name": "Penal Code § 185" },
    { Country: "Poland", "Hate crime law": "1997", "Hate crime law name": "Penal Code", "Hate speech law": "1997", "Hate Speech law name": "Penal Code Art. 256-257" },
    { Country: "Portugal", "Hate crime law": "2007", "Hate crime law name": "Penal Code", "Hate speech law": "1995", "Hate Speech law name": "Penal Code Art. 240" },
    { Country: "Romania", "Hate crime law": "2006", "Hate crime law name": "Criminal Code", "Hate speech law": "2000", "Hate Speech law name": "Emergency Ordinance 137/2000" },
    { Country: "San Marino", "Hate crime law": "2008", "Hate crime law name": "Penal Code", "Hate speech law": "2008", "Hate Speech law name": "Penal Code" },
    { Country: "Serbia", "Hate crime law": "2012", "Hate crime law name": "Criminal Code Art. 54a", "Hate speech law": "2009", "Hate Speech law name": "Law on Prohibition of Discrimination" },
    { Country: "Slovakia", "Hate crime law": "2005", "Hate crime law name": "Criminal Code", "Hate speech law": "2005", "Hate Speech law name": "Criminal Code § 423-424" },
    { Country: "Slovenia", "Hate crime law": "2008", "Hate crime law name": "Criminal Code", "Hate speech law": "2008", "Hate Speech law name": "Criminal Code Art. 297" },
    { Country: "Spain", "Hate crime law": "2015", "Hate crime law name": "Penal Code Art. 22.4", "Hate speech law": "1995", "Hate Speech law name": "Penal Code Art. 510" },
    { Country: "Sweden", "Hate crime law": "1994", "Hate crime law name": "Penal Code Ch. 29 § 2", "Hate speech law": "1948", "Hate Speech law name": "Penal Code Ch. 16 § 8 (Hets mot folkgrupp)" },
    { Country: "Switzerland", "Hate crime law": "1995", "Hate crime law name": "Criminal Code", "Hate speech law": "1995", "Hate Speech law name": "Criminal Code Art. 261bis" },
    { Country: "Turkey", "Hate crime law": "2014", "Hate crime law name": "Turkish Penal Code Art. 122", "Hate speech law": "2004", "Hate Speech law name": "Turkish Penal Code Art. 216" },
    { Country: "Ukraine", "Hate crime law": "2001", "Hate crime law name": "Criminal Code Art. 67", "Hate speech law": "2001", "Hate Speech law name": "Criminal Code Art. 161" },
    { Country: "United Kingdom", "Hate crime law": "1998", "Hate crime law name": "Crime and Disorder Act 1998", "Hate speech law": "1986", "Hate Speech law name": "Public Order Act 1986" }
  ];

  // --- 2. DATI SIMULATI INCIDENTI (2016-2023) ---
  const years = [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
  
  // Genera dati fittizi coerenti per ogni stato
  const sampleIncidentsData = {};
  lawsCSV.forEach((row, i) => {
    const country = row.Country;
    sampleIncidentsData[country] = {};
    const baseVal = (i % 10 + 1) * 8;
    years.forEach((yr, idx) => {
      sampleIncidentsData[country][yr] = Math.round(baseVal + idx * (3 + (i % 3)) + Math.sin(idx) * 5);
    });
  });

  // --- 3. ELABORAZIONE DATI LEGGI ---
  const parsedLawsData = {};
  lawsCSV.forEach(row => {
    const country = row.Country;
    parsedLawsData[country] = [];

    const crimeYr = parseInt(row["Hate crime law"], 10);
    if (!isNaN(crimeYr)) {
      parsedLawsData[country].push({
        year: crimeYr,
        type: "Hate Crime Law",
        title: row["Hate crime law name"] || "Hate crime law",
        color: "#ef4444" // Rosso
      });
    }

    const speechYr = parseInt(row["Hate speech law"], 10);
    if (!isNaN(speechYr)) {
      parsedLawsData[country].push({
        year: speechYr,
        type: "Hate Speech Law",
        title: row["Hate Speech law name"] || "Hate speech law",
        color: "#f59e0b" // Arancione
      });
    }
  });

  // --- 4. STATO E TOOLTIP ---
  let selectedCountry = "Italy";

  // Crea o recupera il tooltip
  let tooltip = d3.select("#standalone-laws-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body").append("div")
      .attr("id", "standalone-laws-tooltip")
      .style("position", "absolute")
      .style("background", "rgba(17, 24, 39, 0.95)")
      .style("color", "#ffffff")
      .style("padding", "8px 12px")
      .style("border-radius", "6px")
      .style("font-size", "12px")
      .style("font-family", "sans-serif")
      .style("pointer-events", "none")
      .style("opacity", "0")
      .style("box-shadow", "0 4px 12px rgba(0,0,0,0.2)")
      .style("z-index", "9999")
      .style("transition", "opacity 0.15s ease");
  }

  // --- 5. FUNZIONE DI RENDERING ---
  function renderChart() {
    const container = d3.select("#incidents-linechart-container");
    if (container.empty()) return;
    container.html("");

    const countriesList = Object.keys(parsedLawsData).sort();

    // Contenitore per Dropdown
    const selectorContainer = container.append("div")
      .style("margin-bottom", "20px")
      .style("display", "flex")
      .style("align-items", "center")
      .style("gap", "10px")
      .style("font-family", "sans-serif");

    selectorContainer.append("label")
      .attr("for", "standalone-country-select")
      .style("font-weight", "bold")
      .style("font-size", "14px")
      .text("Seleziona Stato:");

    const select = selectorContainer.append("select")
      .attr("id", "standalone-country-select")
      .style("padding", "6px 12px")
      .style("border-radius", "6px")
      .style("border", "1px solid #d1d5db")
      .style("font-size", "14px")
      .style("cursor", "pointer");

    select.selectAll("option")
      .data(countriesList)
      .enter()
      .append("option")
      .attr("value", d => d)
      .property("selected", d => d === selectedCountry)
      .text(d => d);

    select.on("change", function () {
      selectedCountry = this.value;
      renderChart();
    });

    // Dimensioni SVG
    const margin = { top: 40, right: 40, bottom: 50, left: 60 };
    const containerWidth = container.node().getBoundingClientRect().width || 750;
    const chartWidth = Math.max(300, containerWidth - margin.left - margin.right);
    const chartHeight = 380 - margin.top - margin.bottom;

    const svg = container.append("svg")
      .attr("width", chartWidth + margin.left + margin.right)
      .attr("height", chartHeight + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const countrySeries = years.map(yr => ({
      year: yr,
      count: sampleIncidentsData[selectedCountry]?.[yr] || 0
    }));

    // Scale
    const x = d3.scalePoint().domain(years).range([0, chartWidth]);
    const maxVal = d3.max(countrySeries, d => d.count) || 10;
    const y = d3.scaleLinear().domain([0, maxVal * 1.2]).range([chartHeight, 0]).nice();

    // Assi
    svg.append("g")
      .attr("transform", `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x))
      .style("font-size", "12px");

    svg.append("g")
      .call(d3.axisLeft(y).ticks(6))
      .style("font-size", "12px");

    // Linea principale
    const line = d3.line()
      .x(d => x(d.year))
      .y(d => y(d.count))
      .curve(d3.curveMonotoneX);

    svg.append("path")
      .datum(countrySeries)
      .attr("fill", "none")
      .attr("stroke", "#6366f1")
      .attr("stroke-width", 3)
      .attr("d", line);

    // Punti della serie temporale
    svg.selectAll(".data-dot")
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
        tooltip.style("opacity", 1)
          .html(`<strong>${selectedCountry} (${d.year})</strong>: ${d.count} casi`)
          .style("left", (event.pageX + 12) + "px")
          .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function () {
        tooltip.style("opacity", 0);
      });

    // Rendering Marcatori Leggi
    const countryLaws = parsedLawsData[selectedCountry] || [];

    countryLaws.forEach((law, idx) => {
      // Se la legge è stata approvata nel range di anni visibile sul grafico (2016-2023)
      if (years.includes(law.year)) {
        const xPos = x(law.year);
        const yOffset = 15 + (idx % 2) * 22;

        // Linea verticale
        svg.append("line")
          .attr("x1", xPos)
          .attr("y1", 0)
          .attr("x2", xPos)
          .attr("y2", chartHeight)
          .attr("stroke", law.color)
          .attr("stroke-width", 2)
          .attr("stroke-dasharray", "4,4");

        // Badge con simbolo §
        const badge = svg.append("g")
          .attr("transform", `translate(${xPos}, ${yOffset})`)
          .style("cursor", "pointer");

        badge.append("circle")
          .attr("r", 9)
          .attr("fill", law.color);

        badge.append("text")
          .attr("text-anchor", "middle")
          .attr("dy", "3px")
          .attr("fill", "#ffffff")
          .style("font-size", "10px")
          .style("font-weight", "bold")
          .text("§");

        badge.on("mouseover", function (event) {
          tooltip.style("opacity", 1)
            .html(`
              <div style="max-width: 220px;">
                <strong style="color: ${law.color};">${law.type} (${law.year})</strong><br/>
                <strong>${law.title}</strong>
              </div>
            `)
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
        }).on("mouseout", function () {
          tooltip.style("opacity", 0);
        });
      }
    });

    // Se la legge è precedente al 2016, aggiungi una nota in basso
    const earlierLaws = countryLaws.filter(l => l.year < years[0]);
    if (earlierLaws.length > 0) {
      const noteText = earlierLaws.map(l => `${l.type}: ${l.title} (${l.year})`).join(" | ");
      container.append("div")
        .style("margin-top", "10px")
        .style("font-size", "11px")
        .style("color", "#6b7280")
        .style("font-family", "sans-serif")
        .html(`<strong>📜 Leggi pre-2016:</strong> ${noteText}`);
    }
  }

  // --- 6. INIZIALIZZAZIONE ---
  if (document.readyState === "complete" || document.readyState === "interactive") {
    renderChart();
  } else {
    document.addEventListener("DOMContentLoaded", renderChart);
  }
})();