const santurceCenter = [18.4465, -66.0620]; //creado variable para centro de santurce
const santurceZoom = 14; //initial zoom level for Santurce

const map = L.map("map").setView(santurceCenter, santurceZoom);//creating a leaflet map and attaching it to the html element
//variable, tool y id

// ===============================
// PANES: creando un container para los layers. A
// Aquí uso leaflet methods
// ===============================

map.createPane("barriosPane");
map.getPane("barriosPane").style.zIndex = 500;

map.createPane("buildingsPane");
map.getPane("buildingsPane").style.zIndex = 650;

map.createPane("buildingTooltipPane");
map.getPane("buildingTooltipPane").style.zIndex = 900;

map.createPane("tranviaPane");
map.getPane("tranviaPane").style.zIndex = 700;

map.createPane("tranviaStopsPane");
map.getPane("tranviaStopsPane").style.zIndex = 750;

// ===============================
// BASEMAP
// Aquí uso el leaflet function para crear un basemap de OpenStreetMap.
// ===============================

L.tileLayer(
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
  { maxZoom: 20, minZoom: 8,
    attribution: "&copy; OpenStreetMap contributors"
  }).addTo(map);


// =============================
// HISTORICAL MAPS 
// =============================

const historicalMaps = [
  {year: 1892, file: "Maps/PR_San_Juan_1892_WEB.webp",
    bounds: [[18.3831408560000007, -66.2347797449999973],
      [18.4835974820000004, -66.0280240670000040]]},
  {year: 1917, file: "Maps/PR_San_Juan_1917_WEB_final.webp",
    bounds: [[18.4287763323525553, -66.0945646778147164], 
      [18.4661742022737556, -66.0435631266270491]]
  },
  {year: 1941, file: "Maps/PR_San_Juan_1941_WEB.webp",
    bounds: [[18.359528584163154, -66.13228410279036],
      [18.504175032734878, -65.9922121040194]]
  },
  {
    year: 1947,
    file: "Maps/PR_San_Juan_1947_WEB.webp",
    bounds: [
      [18.3557783613922609, -66.1335576056266774],
      [18.5077803728184982, -65.9897148877337258]]
  },
  {
    year: 1957,
    file: "Maps/PR_San_Juan_1957_WEB.webp",
    bounds: [
      [18.3580355312879178, -66.1293411199499701],
      [18.5060677123521771, -65.9939755456427406]
    ]
  },
  {
    year: 1963,
    file: "Maps/PR_San_Juan_1963_WEB.webp",
    bounds: [
      [18.3582828550469230, -66.1319046849549039],
      [18.5050333286232167, -65.9933287238592072]]
  },
  {
    year: 1969,
    file: "Maps/PR_San_Juan_1969_WEB.webp",
    bounds: [[18.3560040585413518, -66.1319192076687159],
      [18.5048026818092808, -65.9920131814640598]]
  },
  {
    year: 2024,
    file: "Maps/PR_San_Juan_2024_WEB.webp",
    bounds: [[18.3575836872701075, -66.1322335654766817],
      [18.5112264393033747, -65.9928195973310068]]
  }
];

// let funciona para crear una variable que puede cambiar :) 
let currentOverlay = null; //currently visible overlay
const historicalMapPreloads = new Map();
let historicalOverlayRequest = 0;
let historicalMapsVisible = true; //tracks if thee historical map layer is on
let selectedYear = 1892; //year currently selected by the user, beginning in 1892
let historicalViewInitialized = false;
const minYear = 1890; //minimum year for the timeline
const maxYear = 2026; //maximum year for the timeline

const timelineTrack = document.getElementById("timelineTrack"); //creando una variable con el timelinetrack que están en html
const yearLabel = document.getElementById("yearLabel"); //lo mismo pero con yearlabel
const yearLoading = document.getElementById("yearLoading");

function yearToPosition(year) {
  return ((year - minYear) / (maxYear - minYear)) * 100;
}

function updateActiveMarker(year) {

  document.querySelectorAll(".year-marker").forEach(marker => {

    marker.classList.toggle(
      "active",
      Number(marker.dataset.year) === year
    );

  });

}

function preloadHistoricalMap(selected) {
  if (!historicalMapPreloads.has(selected.file)) {
    const image = new Image();
    image.src = selected.file;
    historicalMapPreloads.set(selected.file, image);
  }

  return historicalMapPreloads.get(selected.file);
}

function preloadHistoricalMap(selected) {
  if (!historicalMapPreloads.has(selected.file)) {
    const image = new Image();
    image.decoding = "async";
    image.src = selected.file;
    historicalMapPreloads.set(selected.file, image);
  }

  return historicalMapPreloads.get(selected.file);
}

function preloadAllHistoricalMaps() {
  historicalMaps.forEach(item => {
    const image = preloadHistoricalMap(item);

    if (image.decode) {
      image.decode().catch(() => {
        // ignore decode errors; the browser can still load it later
      });
    }
  });
}

function loadHistoricalMap(year) {

  selectedYear = year;

  yearLabel.textContent = year;
  updateActiveMarker(year);

  if (!historicalMapsVisible) {
    return;
  }

  const selected = historicalMaps.find(item => item.year === year);

  if (!selected) {
    return;
  }

  const requestId = ++historicalOverlayRequest;
  yearLoading.textContent = "Loading...";
  const image = preloadHistoricalMap(selected);

  const overlay = L.imageOverlay(
    selected.file,
    selected.bounds,
    {
      opacity: 0.85
    }
  );

  overlay.once("load", () => {
    if (requestId !== historicalOverlayRequest) {
      map.removeLayer(overlay);
      return;
    }

    if (currentOverlay) {
      map.removeLayer(currentOverlay);
    }

    currentOverlay = overlay;
    yearLoading.textContent = "";
    restoreLayerStates();
  });

  overlay.once("error", () => {
    if (requestId === historicalOverlayRequest) {
      yearLoading.textContent = "Unable to load map";
    }
  });

  overlay.addTo(map);

  if (image.complete && image.naturalWidth > 0) {
    overlay.fire("load");
  }

  if (!historicalViewInitialized) {
    map.setView(santurceCenter, santurceZoom);
    historicalViewInitialized = true;
  }
}

historicalMaps.forEach(item => {
  const marker = document.createElement("div");
  marker.className = "year-marker";
  marker.dataset.year = item.year;
  marker.style.left = `${yearToPosition(item.year)}%`;

  const dot = document.createElement("button");
  dot.className = "year-dot";
  dot.title = `Show ${item.year}`;

  const label = document.createElement("div");
  label.className = "year-label";
  label.textContent = item.year;

  dot.addEventListener("click", () => {
    loadHistoricalMap(item.year);
  });

  dot.addEventListener("mouseenter", () => {
    preloadHistoricalMap(item);
  });

  dot.addEventListener("focus", () => {
    preloadHistoricalMap(item);
  });

  marker.appendChild(dot);
  marker.appendChild(label);
  timelineTrack.appendChild(marker);
});

// ===============================
// BARRIOS LAYER
// ===============================

let barriosLayer = null;

const projectInfoToggle = document.querySelector(".project-info-toggle");
const projectInfoContent = document.querySelector(".project-info-content");

if (projectInfoToggle && projectInfoContent) {
  projectInfoToggle.addEventListener("click", () => {
    const isExpanded = projectInfoToggle.getAttribute("aria-expanded") === "true";
    projectInfoToggle.setAttribute("aria-expanded", String(!isExpanded));
    projectInfoContent.hidden = isExpanded;
  });
}

const barriosToggle = document.getElementById("barriosToggle");

async function loadBarrios() {
  // If the layer has already been loaded, just show it again
  if (barriosLayer) {
    barriosLayer.addTo(map);
    return;
  }

  try {
    const response = await fetch("Shapefiles/barrios.geojson");

    if (!response.ok) {
      throw new Error("Could not load barrios.geojson");
    }

    const barriosData = await response.json();

    barriosLayer = L.geoJSON(barriosData, {
      pane: "barriosPane",

      style: {
        color: "#CC0033",
        weight: 2,
        opacity: 1,
        fillColor: "#CC0033",
        fillOpacity: 0.05
      },

      onEachFeature: function (feature, layer) {
        const barrioName = feature.properties.NAME || "Barrio";

        // Permanent label
        layer.bindTooltip(barrioName, {
          permanent: true,
          direction: "center",
          className: "barrio-label"
        });

        // Optional popup when the polygon is clicked
        layer.bindPopup(`<strong>${barrioName}</strong>`);

        // Highlight polygon on mouse hover
        layer.on({
          mouseover: function () {
            layer.setStyle({
              weight: 3,
              fillOpacity: 0.15
            });
          },

          mouseout: function () {
            barriosLayer.resetStyle(layer);
          }
        });
      }
    });

    barriosLayer.addTo(map);

  } catch (error) {
    console.error("Barrios layer failed to load:", error);
    alert("The Barrios layer could not be loaded. Check the browser Console.");
  }
}


// ===============================
// BARRIOS CHECKBOX
// ===============================

barriosToggle.addEventListener("change", function () {
  if (this.checked) {
    loadBarrios();
  } else if (barriosLayer) {
    map.removeLayer(barriosLayer);
  }
});

// ===============================
// BARRIOS DESAPARECIDAS LAYER
// ===============================

let disappearedBarriosLayer = null;

const disappearedBarriosToggle = document.getElementById("disappearedBarriosToggle");
const disappearedBarriosSublayers = document.getElementById("disappearedBarriosSublayers");
const regionalPlanToggle = document.getElementById("regionalPlanToggle");
const aerialPhotoToggle = document.getElementById("aerialPhotoToggle");
const disappearedBarrioPointsToggle = document.getElementById("disappearedBarrioPointsToggle");
const disappearedBarrioPanel = document.getElementById("disappearedBarrioPanel");
const disappearedBarrioPanelContent = document.getElementById("disappearedBarrioPanelContent");
const disappearedBarrioPanelClose = document.getElementById("disappearedBarrioPanelClose");

let disappearedBarrioPointsLayer = null;
let disappearedBarrioPointsLoading = null;
const disappearedBarrioDetails = new Map();

L.DomEvent.disableClickPropagation(disappearedBarrioPanel);
L.DomEvent.disableScrollPropagation(disappearedBarrioPanel);

const disappearedBarrioOverlays = {
  regionalPlan: L.imageOverlay(
    "Photos/Barrios_Desaparecidos/arrabales.webp",
    [[18.3397835416345565, -66.2533863624982899], [18.4894282781914221, -65.9036441474156476]],
    { opacity: 0.85, zIndex: 410 }
  ),
  aerialPhoto: L.imageOverlay(
    "Photos/Barrios_Desaparecidos/fotoaerea_1951.jpg",
    [[18.4196969492662781, -66.0880190902426250], [18.4574937427499179, -66.0372323844084264]],
    { opacity: 0.85, zIndex: 400 }
  )
};

function updateDisappearedBarrioOverlays() {
  if (!disappearedBarriosLayer) {
    return;
  }

  Object.entries(disappearedBarrioOverlays).forEach(([name, overlay]) => {
    const toggle = name === "regionalPlan" ? regionalPlanToggle : aerialPhotoToggle;
    if (toggle.checked) {
      overlay.addTo(disappearedBarriosLayer);
    } else {
      disappearedBarriosLayer.removeLayer(overlay);
    }
  });
}

function loadDisappearedBarrios() {
  if (!disappearedBarriosLayer) {
    disappearedBarriosLayer = L.layerGroup();
    updateDisappearedBarrioOverlays();
  }

  disappearedBarriosLayer.addTo(map);

  if (disappearedBarrioPointsToggle.checked) {
    loadDisappearedBarrioPoints();
  }
}

disappearedBarriosToggle.addEventListener("change", function () {
  disappearedBarriosSublayers.hidden = !this.checked;

  if (this.checked) {
    loadDisappearedBarrios();
  } else if (disappearedBarriosLayer) {
    map.removeLayer(disappearedBarriosLayer);
    closeDisappearedBarrioPanel();
  }
});

regionalPlanToggle.addEventListener("change", updateDisappearedBarrioOverlays);
aerialPhotoToggle.addEventListener("change", updateDisappearedBarrioOverlays);

function createDisappearedBarrioIcon() {
  return L.divIcon({
    className: "disappeared-barrio-marker",
    html: "",
    iconSize: [56, 56],
    iconAnchor: [28, 28]
  });
}

function closeDisappearedBarrioPanel() {
  disappearedBarrioPanel.hidden = true;
  disappearedBarrioPanelContent.replaceChildren();
}

function renderDisappearedBarrioPanel(barrio, photos) {
  disappearedBarrioPanelContent.replaceChildren();
  const title = document.createElement("h2");
  title.textContent = barrio.name;
  const description = document.createElement("p");
  description.className = "disappeared-barrio-description";
  description.textContent = barrio.description;
  disappearedBarrioPanelContent.append(title);

  if (!photos.length) {
    disappearedBarrioPanelContent.append(description);
    disappearedBarrioPanel.hidden = false;
    return;
  }

  let photoIndex = 0;
  const gallery = document.createElement("section");
  gallery.className = "disappeared-barrio-gallery";
  const renderPhoto = () => {
    gallery.replaceChildren();
    const photo = photos[photoIndex];
    const frame = document.createElement("div");
    frame.className = "disappeared-barrio-photo-frame";
    const image = document.createElement("img");
    image.src = `Photos/Barrios_Desaparecidos/${encodeURIComponent(photo.foto)}`;
    image.alt = `${barrio.name}, ${photo.fotografia || "fotografía histórica"}`;
    frame.append(image);

    if (photos.length > 1) {
      const previous = document.createElement("button");
      previous.type = "button";
      previous.className = "disappeared-barrio-photo-button previous";
      previous.setAttribute("aria-label", "Foto anterior");
      previous.innerHTML = "&lsaquo;";
      previous.addEventListener("click", () => {
        photoIndex = (photoIndex - 1 + photos.length) % photos.length;
        renderPhoto();
      });
      const next = document.createElement("button");
      next.type = "button";
      next.className = "disappeared-barrio-photo-button next";
      next.setAttribute("aria-label", "Foto siguiente");
      next.innerHTML = "&rsaquo;";
      next.addEventListener("click", () => {
        photoIndex = (photoIndex + 1) % photos.length;
        renderPhoto();
      });
      frame.append(previous, next);
    }

    const metadata = document.createElement("p");
    metadata.className = "disappeared-barrio-photo-metadata";
    metadata.textContent = [photo.fotografia, photo.fuente].filter(Boolean).join(" | ");
    gallery.append(frame, metadata);
  };

  renderPhoto();
  disappearedBarrioPanelContent.append(gallery, description);
  disappearedBarrioPanel.hidden = false;
}

async function openDisappearedBarrioPanel(barrio) {
  disappearedBarrioPanelContent.textContent = "Cargando...";
  disappearedBarrioPanel.hidden = false;

  try {
    if (!disappearedBarrioDetails.has(barrio.file)) {
      const response = await fetch(`Photos/Barrios_Desaparecidos/${encodeURIComponent(barrio.file)}.csv`);
      if (!response.ok) {
        throw new Error(`Could not load details for ${barrio.file}`);
      }
      disappearedBarrioDetails.set(barrio.file, parseCSV(await response.text()).filter(photo => photo.foto));
    }
    renderDisappearedBarrioPanel(barrio, disappearedBarrioDetails.get(barrio.file));
  } catch (error) {
    console.error("Barrio desaparecido failed to load:", error);
    disappearedBarrioPanelContent.textContent = "No se pudo cargar la información de este barrio.";
  }
}

async function loadDisappearedBarrioPoints() {
  if (disappearedBarrioPointsLayer) {
    disappearedBarrioPointsLayer.addTo(disappearedBarriosLayer);
    return;
  }

  if (disappearedBarrioPointsLoading) {
    return disappearedBarrioPointsLoading;
  }

  disappearedBarrioPointsLoading = fetch("Photos/Barrios_Desaparecidos/barrios_desa.csv")
    .then(response => {
      if (!response.ok) {
        throw new Error("Could not load barrios_desa.csv");
      }
      return response.text();
    })
    .then(text => {
      disappearedBarrioPointsLayer = L.layerGroup();
      parseCSV(text)
        .map(row => ({
          file: row.file,
          name: row.barrio,
          lat: Number(row.x),
          lng: Number(row.y),
          description: row.descripcion
        }))
        .filter(barrio => barrio.file && barrio.name && Number.isFinite(barrio.lat) && Number.isFinite(barrio.lng))
        .forEach(barrio => {
          L.marker([barrio.lat, barrio.lng], {
            icon: createDisappearedBarrioIcon(),
            pane: "buildingsPane"
          }).on("click", () => openDisappearedBarrioPanel(barrio)).addTo(disappearedBarrioPointsLayer);
        });
      disappearedBarrioPointsLayer.addTo(disappearedBarriosLayer);
    })
    .finally(() => {
      disappearedBarrioPointsLoading = null;
    });

  return disappearedBarrioPointsLoading;
}

disappearedBarrioPointsToggle.addEventListener("change", function () {
  if (this.checked) {
    loadDisappearedBarrioPoints().catch(error => {
      console.error("Barrios desaparecidos points failed to load:", error);
    });
  } else if (disappearedBarrioPointsLayer && disappearedBarriosLayer) {
    disappearedBarriosLayer.removeLayer(disappearedBarrioPointsLayer);
    closeDisappearedBarrioPanel();
  }
});

disappearedBarrioPanelClose.addEventListener("click", closeDisappearedBarrioPanel);

// ===============================
// TRANVÍA LAYER
// ===============================

let tranviaLayer = null;

const tranviaToggle = document.getElementById("tranviaToggle");

async function loadTranvia() {
  if (tranviaLayer) {
    tranviaLayer.addTo(map);
    return;
  }

  try {
    const [lineResponse, stopsResponse] = await Promise.all([
      fetch("Shapefiles/tranvia_linea.geojson"),
      fetch("tranvia_paradas.geojson")
    ]);

    if (!lineResponse.ok || !stopsResponse.ok) {
      throw new Error("Could not load the tranvía files.");
    }

    const [lineData, stopsData] = await Promise.all([
      lineResponse.json(),
      stopsResponse.json()
    ]);

    tranviaLayer = L.featureGroup();

    const lineLayer = L.geoJSON(lineData, {
      pane: "tranviaPane",
      style: {
        color: "#1f78b4",
        weight: 4,
        opacity: 1,
        lineCap: "round",
        lineJoin: "round"
      }
    });

    const stopsLayer = L.geoJSON(stopsData, {
      pane: "tranviaStopsPane",
      pointToLayer: function (feature, latlng) {
        return L.circleMarker(latlng, {
          pane: "tranviaStopsPane",
          radius: 9,
          color: "#fff3b0",
          fillColor: "#ffb703",
          fillOpacity: 1,
          weight: 2,
          opacity: 1
        });
      },
      onEachFeature: function (feature, layer) {
        const stopName = feature.properties?.Nombre || "Parada del tranvía";
        const stopNumber = feature.properties?.Parada;

        layer.bindTooltip(
          stopNumber ? `Parada ${stopNumber}: ${stopName}` : stopName,
          { direction: "top", className: "barrio-label" }
        );
      }
    });

    lineLayer.addTo(tranviaLayer);
    stopsLayer.addTo(tranviaLayer);
    tranviaLayer.addTo(map);

  } catch (error) {
    console.error("Tranvía layer failed to load:", error);
    alert("The Tranvía layer could not be loaded. Check the browser Console.");
  }
}

tranviaToggle.addEventListener("change", function () {
  if (this.checked) {
    loadTranvia();
  } else if (tranviaLayer) {
    map.removeLayer(tranviaLayer);
  }
});

// ===============================
// HISTORICAL MAP TOGGLE
// ===============================

const historicalToggle =
    document.getElementById("historicalMapsToggle");

historicalToggle.addEventListener("change", function () {

    historicalMapsVisible = this.checked;

    if (historicalMapsVisible) {

        document.getElementById("timeline").style.display = "block";

        loadHistoricalMap(selectedYear);

    } else {

        document.getElementById("timeline").style.display = "none";

        if (currentOverlay) {
            map.removeLayer(currentOverlay);
            currentOverlay = null;
        }

    }

});

// ===============================
// LUGARES DE INTERES
// ===============================

let interestLayer = null;
let interestLayerEnabled = false;

const interestLayers = new Map();
const interestDetails = new Map();
const interestToggle = document.getElementById("historicBuildingsToggle");
const interestClassifications = document.getElementById("interestClassifications");

function createInterestIcon(classification) {
  const icons = {
    residencias: "🏠",
    escuelas: "🏫",
    religioso: "⛪",
    cine: "🎬",
    cementerio: "🪦",
    hospitales: "🏥",
    comercios: "🏪"
  };

  return L.divIcon({
    className: "historic-building-marker",
    html: icons[classification] || "🏛️",
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
}

function parseCSV(text) {

  const rows = [];
  let row = [];
  let field = "";
  let insideQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && insideQuotes && nextCharacter === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      insideQuotes = !insideQuotes;
    } else if (character === "," && !insideQuotes) {
      row.push(field.trim());
      field = "";
    } else if ((character === "\n" || character === "\r") && !insideQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }

      row.push(field.trim());
      if (row.some(value => value !== "")) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += character;
    }
  }

  if (field !== "" || row.length > 0) {
    row.push(field.trim());
    if (row.some(value => value !== "")) {
      rows.push(row);
    }
  }

  const headers = (rows.shift() || []).map(header => header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim());

  return rows.map(values => Object.fromEntries(
    headers.map((header, index) => [header, values[index] || ""])
  ));
}

function parseInterestIndex(text) {
  return parseCSV(text)
    .map(place => ({
      id: place.points,
      classification: place.class,
      lat: Number(place.x),
      lng: Number(place.y)
    }))
    .filter(place => (
      place.id &&
      place.classification &&
      Number.isFinite(place.lat) &&
      Number.isFinite(place.lng)
    ));
}

function decodeBuildingCSV(bytes) {

  const macRomanCharacters = {
    0x87: "á",
    0x8e: "é",
    0x92: "í",
    0x96: "ñ",
    0x97: "ó",
    0xca: "\u00a0",
    0xd2: "“",
    0xd3: "”"
  };
  const fallbackDecoder = new TextDecoder("windows-1252");

  return Array.from(bytes, byte => (
    macRomanCharacters[byte] || fallbackDecoder.decode(new Uint8Array([byte]))
  )).join("");
}

function addPopupDetail(container, label, value) {
  if (!value) {
    return;
  }

  const detail = document.createElement("p");
  detail.className = "interest-popup-detail";
  if (label === "Referencias") {
    detail.classList.add("interest-popup-reference");
  }
  const detailLabel = document.createElement("strong");
  detailLabel.textContent = `${label}: `;
  detail.append(detailLabel, value);
  container.append(detail);
}

function addInterestDates(container, photo) {
  const dates = [
    ["Fotografía", photo["fotografia de"]],
    ["Construido en", photo["construida en"]]
  ].filter(([, value]) => value);

  if (!dates.length) {
    return;
  }

  const dateDetails = document.createElement("div");
  dateDetails.className = "interest-date-details";
  dates.forEach(([label, value]) => {
    const date = document.createElement("div");
    const dateLabel = document.createElement("strong");
    dateLabel.textContent = label;
    const dateValue = document.createElement("span");
    dateValue.textContent = value;
    date.append(dateLabel, dateValue);
    dateDetails.append(date);
  });
  container.append(dateDetails);
}

function createInterestPopup(place, photos) {
  const card = document.createElement("article");
  card.className = "interest-popup-card";
  const slides = photos.length ? photos : [{}];
  const placeName = slides.find(photo => photo.nombre)?.nombre || place.id;
  let photoIndex = 0;

  const renderSlide = () => {
    card.replaceChildren();
    const photo = slides[photoIndex];
    const title = document.createElement("h3");
    title.textContent = photo.nombre || placeName;
    card.append(title);

    if (photo.file) {
      const photoFrame = document.createElement("div");
      photoFrame.className = "interest-photo-frame";
      const image = document.createElement("img");
      image.src = `Photos/Lugares_Interes/${encodeURIComponent(photo.file)}`;
      image.alt = photo.nombre || placeName;
      photoFrame.append(image);

      if (slides.length > 1) {
        const previous = document.createElement("button");
        previous.className = "interest-photo-button previous";
        previous.type = "button";
        previous.setAttribute("aria-label", "Foto anterior");
        previous.innerHTML = "&lsaquo;";
        previous.addEventListener("click", event => {
          event.stopPropagation();
          photoIndex = (photoIndex - 1 + slides.length) % slides.length;
          renderSlide();
        });

        const next = document.createElement("button");
        next.className = "interest-photo-button next";
        next.type = "button";
        next.setAttribute("aria-label", "Foto siguiente");
        next.innerHTML = "&rsaquo;";
        next.addEventListener("click", event => {
          event.stopPropagation();
          photoIndex = (photoIndex + 1) % slides.length;
          renderSlide();
        });
        photoFrame.append(previous, next);
      }

      card.append(photoFrame);
    }

    addInterestDates(card, photo);
    addPopupDetail(card, "Descripción", photo.descripcion);
    addPopupDetail(card, "Fuente", photo.fuente);
    addPopupDetail(card, "Referencias", photo.referencias);

    if (slides.length > 1) {
      const counter = document.createElement("p");
      counter.className = "interest-photo-counter";
      counter.textContent = `${photoIndex + 1} / ${slides.length}`;
      card.append(counter);
    }
  };

  renderSlide();
  return card;
}

async function getInterestDetails(placeId) {
  if (!interestDetails.has(placeId)) {
    const response = await fetch(`Photos/Lugares_Interes/${encodeURIComponent(placeId)}.csv`);
    if (!response.ok) {
      throw new Error(`Could not load details for ${placeId}`);
    }

    interestDetails.set(placeId, parseCSV(await response.text()).filter(photo => photo.file));
  }

  return interestDetails.get(placeId);
}

function openInterestPopup(place, marker) {
  const popup = L.popup({
    className: "interest-popup",
    maxWidth: 480,
    minWidth: 320,
    autoPan: true,
    offset: L.point(24, 0),
    autoPanPadding: [8, 8]
  }).setLatLng(marker.getLatLng()).setContent("Cargando...");

  popup.openOn(map);
  getInterestDetails(place.id)
    .then(photos => {
      popup.setContent(createInterestPopup(place, photos));
      requestAnimationFrame(() => {
        const content = popup.getElement()?.querySelector(".leaflet-popup-content");
        if (content) {
          content.style.height = `${content.offsetHeight}px`;
          popup.update();
        }
      });
    })
    .catch(error => {
      console.error("Lugar de interés failed to load:", error);
      popup.setContent("No se pudo cargar la información de este lugar.");
    });
}

function addInterestClassification(classification) {
  const layer = L.layerGroup().addTo(interestLayer);
  interestLayers.set(classification, layer);

  const label = document.createElement("label");
  label.className = "interest-classification";
  const input = document.createElement("input");
  input.type = "checkbox";
  input.checked = true;
  input.addEventListener("change", () => {
    if (input.checked) {
      layer.addTo(interestLayer);
    } else {
      interestLayer.removeLayer(layer);
    }
  });
  const text = document.createElement("span");
  text.textContent = classification;
  label.append(input, text);
  interestClassifications.append(label);
  return layer;
}

async function loadInterestLayer() {
  if (interestLayer) {
    interestLayer.addTo(map);
    return;
  }

  const response = await fetch("Photos/Lugares_Interes/lugares.csv");
  if (!response.ok) {
    throw new Error("Could not load lugares.csv");
  }

  const places = parseInterestIndex(await response.text());
  interestLayer = L.layerGroup();

  places.forEach(place => {
    const classificationLayer = interestLayers.get(place.classification) ||
      addInterestClassification(place.classification);
    const marker = L.marker([place.lat, place.lng], {
      icon: createInterestIcon(place.classification),
      pane: "buildingsPane"
    });
    marker.on("click", () => openInterestPopup(place, marker));
    marker.addTo(classificationLayer);
  });

  interestLayer.addTo(map);
}

interestToggle.addEventListener("change", function () {
  interestLayerEnabled = this.checked;
  interestClassifications.hidden = !this.checked;

  if (this.checked) {
    loadInterestLayer().catch(error => {
      console.error("Lugares de interés layer failed to load:", error);
      alert("La capa Lugares de Interés no se pudo cargar. Revisa la consola.");
    });
  } else if (interestLayer) {
    map.removeLayer(interestLayer);
  }
});

map.on("popupopen", event => {
  const popupElement = event.popup.getElement();
  if (popupElement) {
    L.DomEvent.disableClickPropagation(popupElement);
    L.DomEvent.disableScrollPropagation(popupElement);
  }
});

  function restoreLayerStates() {

    if (interestLayerEnabled && interestLayer) {

      interestLayer.addTo(map);

    }

    if (barriosToggle && barriosToggle.checked && barriosLayer) {

      barriosLayer.addTo(map);

    }

    if (disappearedBarriosToggle.checked && disappearedBarriosLayer) {

      disappearedBarriosLayer.addTo(map);

    }

    if (tranviaToggle && tranviaToggle.checked && tranviaLayer) {

      tranviaLayer.addTo(map);

    }

  }

preloadAllHistoricalMaps();
loadHistoricalMap(1892);