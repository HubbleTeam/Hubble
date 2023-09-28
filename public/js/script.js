///////////////////////////
//        FETCH DB       //
///////////////////////////

let db, i18n;

async function fetchData() {
  try {
    const response = await fetch("./db.json"); // Wait for the fetch to be completed
    db = await response.json(); // Wait for the data to be converted to JSON
    const response2 = await fetch("./i18n.json"); // Wait for the fetch to be completed
    i18n = await response2.json(); // Wait for the data to be converted to JSON
    load();
  } catch (error) {
    console.error(error); // Log any errors that may have occurred
  }
}

fetchData();



///////////////////////////
//  SHORTHAND SELECTORS  //
///////////////////////////

function $(selector) {
  return document.querySelector(selector);
}

function $A(selector) {
  return document.querySelectorAll(selector);
}



///////////////////////////
//      LOADING HTML     //
///////////////////////////

async function load() {
  const filesToLoad = ["./html/sidepanel.html", "./html/settings.html", "./html/about.html", "./html/welcome.html", "./html/whatsnew.html", "./html/report.html"];
  let loadingFiles = [];
  for (const file of filesToLoad) {
    loadingFiles.push(fetch(file)
      .then(res => res.text())
      .then(html => {
        document.body.innerHTML = html + document.body.innerHTML;
    }));
  }

  Promise.all(loadingFiles).then(() => {
    if (document.readyState == "loading") {
      document.addEventListener('DOMContentLoaded', init, false);
    } else {
      init();
    }
  }) //ça c bon
}

// THREAD INITIAL, rien n'est exécuté avant ça



///////////////////////////
//         INIT          //
///////////////////////////
var rootElm, defaultDayElm;

function init() {
  defaultDayElm = $("#days-selector > div:nth-child(1) > input");
  rootElm = $(":root");
  
  // handleInput();
  
  $("#identifiant").addEventListener("input", handleInput);

  $("#days-selector").addEventListener("change", (event) => {
    const week = parseInt($("#week-selector").dataset.week)
    fetchEdt(event.target.value, week);
  });
  
  notifState()
  debug();
  lngSelect()
  lngSet();
  initPullToRefresh();
  ecoMode();
  startup();
  welcomeMessage();
  openPasswordForm();
  navigator.onLine ? online() : offline();
}



/////////////////////////////////////
//         ONLINE / OFFLINE        //
/////////////////////////////////////

async function online() {
  const { day, week } = getCurrentDate();
  $("#week-selector").dataset.week = week;
  if (`${day}` == 6) {
    const currentDayInput = $(`input.day[value="5"]`);
    currentDayInput.checked = true;
  } else {
    const currentDayInput = $(`input.day[value="${day}"]`);
    currentDayInput.checked = true;
  }
  await fetchEdt(day, week);
  fetchName();
  updateDaysOfWeek(`${week}`);
  const etudiant = localStorage.getItem("currentStudentID");
  $("#week-indicator").innerText = `${lngInject("week")} ${week}`;
  
  checkForNewVersion();
  
  $("#splash-screen").style.opacity = '0';
  setTimeout(() => {
    $("#splash-screen").remove();
  }, 500)
}

async function offline() {
  const { day, week } = getCurrentDate();
  $("#week-selector").dataset.week = week;
  if (`${day}` == 6) {
    const currentDayInput = $(`input.day[value="5"]`);
    currentDayInput.checked = true;
  } else {
    const currentDayInput = $(`input.day[value="${day}"]`);
    currentDayInput.checked = true;
  }
  await fetchEdt(day, week);
  fetchName();
  updateDaysOfWeek(`${week}`);
  const etudiant = localStorage.getItem("currentStudentID");
  $("#week-indicator").innerText = `${lngInject("week")} ${week}`;
  
  $("#splash-screen").style.opacity = '0';
  setTimeout(() => {
    $("#splash-screen").remove();
  }, 500)
}



///////////////////////////
//       TEMPLATES       //
///////////////////////////

function generateCoffee(pause) {
  return `<div>
          </div>`;
}

function generatePause(pause) {
  return `<div>
            <p><b>${pause.start}</b><br>${pause.end}</p>
            <p>${lngInject("lunchBreak")}</p>
          </div>`;
}

function generateLesson(lesson) {
  return `<p class="lesson-hour"><b>${lesson.start}</b><br>${lesson.end}</p>
          <div>
            <p class="lesson-title"><b>${lesson.spe}</b></p>
            <div class="lesson-details">
              <div>
                <i class="ph-fill ph-student"></i>
                <p>${lesson.lessonType}</p>
              </div>
              <div>
                <p>${lesson.prof}</p>
                <hr>
                <p>${lesson.room}</p>
              </div>       
            </div>
          </div>`;
}



function generateToast(icon, msg) {
  return `<i class="ph ph-${icon}"></i>
          <span>${msg}</span>`;
}

function createToast(status, msg) {
  const toast = document.createElement('div');
  toast.classList.add("toast");
  // toast.innerText = msg;
  
  if (status == "Success") {
    toast.innerHTML = generateToast("check", msg);
    toast.style.backgroundColor = "green";
  } else if (status == "Error") {
    toast.innerHTML = generateToast("x", msg);
    toast.style.backgroundColor = "red";
  } else if (status == "Neutral") {
    toast.innerHTML = generateToast("info", msg);
    toast.style.backgroundColor = "var(--accent-color)";
  }
  
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.top = "80%";
  }, 500)
  setTimeout(() => {
    toast.style.top = "100%";
    setTimeout(() => {
      toast.remove();
    }, 500)
  }, 5000)
}



function welcomeMessage() {
  const keys = Object.keys(db.catchPhrases);
  const result = db.catchPhrases[keys[Math.floor(Math.random() * keys.length)]];

  $("#splash-screen > div > p").innerText = result;
}



async function checkForNewVersion() {
  deleteCacheEntry("/version");
  
  const currentVersion = db.version;
  console.log(`Version de l'app: ${currentVersion}`);
  $("#version").innerText = currentVersion;
  
  fetch("/version", {
    // method: 'GET',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    cache: "no-store"
  })
  .then(response => response.text())
  .then(version => {
    console.log(`Version du serveur: ${version}`);
    if (version !== currentVersion) {
      createToast("Neutral", `Nouvelle version disponible (${version}) ! Màj au relancement de l'application.`);
      caches.keys().then(function(names) {
        for (let name of names) caches.delete(name);
      });
    }
    
    if (currentVersion.includes("-")) {
      let versionLabel = document.createElement("span");
      
      if (currentVersion.includes("beta")) {
        versionLabel.innerText = "BETA";
      } else if (currentVersion.includes("rc")) {
        versionLabel.innerText = "RC";
      }
      
      versionLabel.classList.add("beta-label");
      $("#header > div > a").parentNode.insertBefore(versionLabel.cloneNode(true), $("#header > div > a").nextSibling);
      $("#about .flyout-content > div > p > b").parentNode.insertBefore(versionLabel, $("#about .flyout-content > div > p > b").nextSibling);
    }
  })
  .catch(error => {
    console.error("Erreur lors de la récupération de la version: ", error);
  });
}



///////////////////////////
//       GET INFO        //
///////////////////////////

// get current day and week
function getCurrentDate() {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) / (24 * 60 * 60 * 1000));
  const week = Math.ceil(days / 7);
  const day = currentDate.getDay() ? currentDate.getDay() - 1 : 0
  return { day, week };
}

// get max weeks in a year
function getMaxWeeks(year) {
  const firstDayOfYear = new Date(year, 0, 1);
  const lastDayOfYear = new Date(year, 11, 31);
  return Math.floor((lastDayOfYear - firstDayOfYear) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

// get numbers of days of week...
function getWeekDayNumbers(weekNumber) {
  const date = new Date(2023, 0, 1 + (weekNumber - 1) * 7 + 1);
  const result = {};
  for (let i = 0; i < 7; i++) {
    result[i] = date.getDate();
    date.setDate(date.getDate() + 1);
  }
  return result;
}

// ...and set them as the days selector labels
function updateDaysOfWeek(weekNumber) {
  const daysOfWeek = getWeekDayNumbers(weekNumber);
  $A("#days-selector label b").forEach(function(label, index) {
    label.textContent = daysOfWeek[index];
  });
}

async function changeWeek(direction) {
  let week = parseInt($("#week-selector").dataset.week);
  const previousYear = new Date().getFullYear() - 1;
  
  if (direction === "previous") {
    if (week > 1) {
      week--;
    } else {
      week = getMaxWeeks(previousYear) - 1;
    }
  } else if (direction === "next") {
    if (week < getMaxWeeks(previousYear) - 1) {
      week++;
    } else {
      week = 1;
    }
  }
  
  $("#week-selector").dataset.week = week;
  $("#days-selector > div:nth-child(1) > input").checked = true;
  await fetchEdt(0, week);
  $("#week-indicator").innerText = `${lngInject("week")} ${week}`;
  updateDaysOfWeek(`${week}`);
}



///////////////////////////
//        RENDER         //
///////////////////////////

function activeHour(lesson) {
  const element = $(`#idC${idCounter}`);
  const now = new Date();
  const dayNb = now.getDate();
  const currentTime = now.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'});
  
  if (currentTime >= lesson.start && currentTime < lesson.end && dayNb == lesson.day) {
    if (lesson.type === "lesson") {
      element.classList.replace("inactive", "active");
    } else {
      element.classList.replace("dot", "active");
    }
  } else {
    if (lesson.type === "lesson") {
      element.classList.replace("active", "inactive");
    } else {
      element.classList.replace("active", "dot");
    }
  }
}

async function fetchEdt(day, week) {
  const array = await fetch(`/edt?id=${window.localStorage.currentStudentID}&week=${week}&passwd=${window.localStorage.currentStudentPassword}`)
    .then(response => response.json());
  
  clearLessons();
  idCounter = 0;
  // deleteCacheEntry("/edt");
  
  console.log(array);
  
  if (array[day][1][0]) {
    $("#line").style.display = "block";
    $("#main-content > p").style.display = "none";
    for (const session of array[day][1]) {
      const entry = document.createElement("div");
      entry.className = "entry";
      if (session.type == "lesson") {
        idCounter += 1;
        entry.innerHTML = generateLesson(session);
        entry.setAttribute("id", `idC${idCounter}`);
        entry.setAttribute("class", "entry inactive");
      } else if (session.type == "lunchBreak") {
        idCounter += 1;
        entry.innerHTML = generatePause(session);
        entry.setAttribute("id", `idC${idCounter}`);
        entry.setAttribute("class", "entry dot");
      } else if (session.type == "coffeeBreak") {
        idCounter += 1;
        entry.innerHTML = generateCoffee(session);
        entry.setAttribute("id", `idC${idCounter}`);
        entry.setAttribute("class", "entry dot");
      }
      
      $("#main-content").appendChild(entry);
      activeHour(session);
    }
  } else {
    $("#main-content > p").style.display = "block";
    document.getElementById("line").style.display = "none";
  }
}

function clearLessons() {
  $A(".entry").forEach(entry => {
    entry.parentNode.removeChild(entry);
  });
}



/////////////////////////////
//         GET NAME        //
/////////////////////////////

let studentName;

async function fetchName() {
  const response = await fetch(`/getName?passwd=${window.localStorage.currentStudentPassword}&id=${window.localStorage.currentStudentID}&`);
  const data = await response.json();
  studentName = data.name;
  let studentNameArray = studentName.split(' ');
  
  if (studentName) {
    $("#student-name").innerHTML = `<b>${studentNameArray[1]}</b><br>${studentNameArray[0]}`;
    $("#short-name").innerHTML = `${studentNameArray[1][0]}${studentNameArray[0][0]}`;
  }
}



/////////////////////////////
// ID Form & Local Storage //
/////////////////////////////

function assignIdentifier() {
  const currentStudentID = $("#identifiant").value;
  let currentStudentPassword = $("#password").value;
  
  const regex = /^\d{1,10}$/;
  if (!regex.test(currentStudentID)) {
    createToast("Error", "L'identifiant doit contenir uniquement des chiffres et avoir une longueur maximale de 10 caractères.");
    return;
  }
  if (currentStudentPassword == '') {
    currentStudentPassword = "123";
  }
  
  localStorage.setItem("currentStudentPassword", currentStudentPassword);
  localStorage.setItem("currentStudentID", currentStudentID);
}

function openPasswordForm() {
  $("#openPwdButton").addEventListener("click", function (event) {
    if ($("#passwordForm").style.display === "none") {
      $("#passwordForm").style.display = "block";
    } else {
      $("#passwordForm").style.display = "none";
    }
  });
}

function logout() {
  localStorage.clear();
  location.reload();
}



///////////////////////////
//    PULL TO REFRESH    //
///////////////////////////

function initPullToRefresh() {
  PullToRefresh.init({
    mainElement: timeline,
    triggerElement: main,
    async onRefresh() {
      deleteSession();
      deleteCacheEntry("/edt");
      const week = parseInt($("#week-selector").dataset.week);
      const radioDay = $(".day:checked").value;
      await fetchEdt(parseInt(radioDay), week);
    }
  });
}

const cache = "HubbleCache";

//DEBUG FUNCTION
function clearCache() {
  caches.delete("HubbleCache")
    .then(() => {
      console.log("Cache cleared successfully.");
      location.reload();
    })
    .catch(error => {
      console.error("Error clearing cache:", error);
    });
}

function deleteCacheEntry(entry) {
  console.log(entry);
  caches.open("HubbleCache").then(function(cache) {
    cache.keys().then(function(keys) {
      keys.forEach(function(request) {
        if (request.url.includes(entry)) {
          cache.delete(request);
        }
      });
    });
  }).catch(error => {
    console.error('Cache removal error:', error);
  });
}



///////////////////////////
//    BUG REPORT FORM    //
///////////////////////////

async function sendReport() {
const response = await fetch(`/getIDBlackList`);
if (response.ok) {
  const data = await response.json();
  console.log("Données reçues du serveur:", data);
} else {
  console.error("La requête a échoué avec le statut:", response.status);
}

  const email = $("#emailReport").value;
  const sujet = $("#sujetReport").value;
  const description = $("#descriptionReport").value
  
  const postData = { email, sujet, description, studentName }; // Les données à envoyer
  
//     // Cacher le bouton d'envoi
//   document.getElementById('sendButton').style.display = 'none';
  
//   // Afficher le loader
//   document.getElementById('loader').style.display = 'block';

  
  if (typeof postData.sujet !== 'string' || postData.sujet.trim() === '' ||
    typeof postData.description !== 'string' || postData.description.trim() === '' ||
    !localStorage.getItem("currentStudentID")) {
    
    let errorMsg = "Le formulaire est mal rempli";
    if (typeof postData.sujet !== 'string' || postData.sujet.trim() === '') {
      errorMsg = "Le champ 'sujet' est obligatoire et doit contenir du texte";
    } else if (typeof postData.description !== 'string' || postData.description.trim() === '') {
      errorMsg = "Le champ 'description' est obligatoire et doit contenir du texte";
    } else if (!localStorage.getItem("currentStudentID")) {
      errorMsg = "Impossible d'envoyer le formulaire sans être connecté";
    }
    
    createToast("Error", errorMsg);
    return;
  }
    
  fetch("/sendReport", { // URL du serveur
    method: "POST", // Méthode HTTP
    headers: {
      "Content-Type": "application/json", // Type de contenu
    },
    body: JSON.stringify(postData), // Convertir l'objet en chaîne JSON
  })
  .then(response => {
    if (response.ok) { // Vérifier si la réponse est OK
      createToast("Success", "Le rapport a bien été envoyé");
      //clear des champs de saisies
    const inputs = $A("#emailReport, #sujetReport, #descriptionReport");
    inputs.forEach(input => input.value = "");

    } else {
      createToast("Error", "Erreur lors de l'envoi du rapport");
    }
    return response; // Convertir la réponse en objet JavaScript
  })
  .then(data => {
    console.log("Réponse du serveur :", data); // Afficher la réponse du serveur dans la console
  })
  .catch(error => {
    console.error("Erreur :", error); // Afficher les erreurs dans la console
  });
  
//   // Rétablir le bouton d'envoi
//   document.getElementById('sendButton').style.display = 'block';

//   // Cacher le loader
//   document.getElementById('loader').style.display = 'none';
}



///////////////////////////
//     NOTIFICATIONS     //
///////////////////////////

function notifState() {
  document.getElementById("notifSwitch").addEventListener("change", function () {
    if (this.checked) {
      //check si safari > 16.4
      $("#notifCheck").checked = true;
      if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {
        const safariVersion = parseFloat((navigator.userAgent.match(/Version\/(\d+\.\d+)/) || [])[1]);
        if (safariVersion > 16.4) {
          createToast("Error", `Votre version de Safari est inférieure à 16.4 (Vous êtes sur ${safariVersion}). Les notifications ne sont pas disponibles.`);
          input.checked = false;
          return;
        }
      }
      localStorage.setItem("notifications", true);
      console.log("notif activé");
    } else {
      $("#notifCheck").checked = false;
      localStorage.setItem("notifications", false);
      console.log("notif désactivé");
    }
  }); 
}





///////////////////////////
//       LANGUAGES       //
///////////////////////////

let selectedLng = localStorage.getItem("selectedLng") || "fr";

function lngInject(text) {
  return i18n.languages[selectedLng][text];
}

function lngSelect() {
  const languageSelectElements = $A("#languageSel");
  
  languageSelectElements.forEach(languageSelect => {
    for (const key of Object.keys(i18n.languages)) {
      let option = document.createElement("option");
      option.text = i18n.languages[key].name;
      option.value = key;
      languageSelect.appendChild(option);
    }

    languageSelect.addEventListener("change", function () {
      localStorage.setItem("selectedLng", this.value);
      selectedLng = this.value;
      lngSet();
    });
    
    languageSelect.value = selectedLng;
  });
}

function lngSet() {
  $("#made-with-love").innerText = lngInject("madeWithLove");
  // $("#license > span").innerText = lngInject("license");
  // $("#license > a").innerText = lngInject("viewLicense");
  // $("#icons-by > span").innerText = lngInject("iconsBy");
  $("#settings-btn > span").innerText = lngInject("settings");
  $("#main-content > p").innerText = lngInject("noLesson");
  $("#global-settings h2").innerText = lngInject("settings");
  $("#about h2").innerText = lngInject("about");
  $("#whatsnew h2").innerText = lngInject("whatsNew");
  $("#report h2").innerText = lngInject("reportBug");
  // $("#about .flyout-content > div > p").innerHTML = `<img src="https://cdn.glitch.global/7ed579fb-1d9c-4094-9d28-e52d65f8a515/Frame%205%20(1).png?v=1682955087658" alt="logo Hubble">
  //         <br>
  //         <b>Version <span id="version"></span></b><span class="beta-label">BETA</span>
  //         <br><br>
  //         ${lngInject("aboutDescription")}`;
  // $("#authors > h3").innerText = lngInject("createdBy");
  $("#about .flyout-content > div:last-of-type > h3").innerText = lngInject("moreInfo");
  $("#themesBtn > p").innerHTML = `
        <b>${lngInject("themes")}</b>
        <br>
        ${lngInject("themesDescription")}`;
  $("#lngBtn > p").innerHTML = `
      <b>${lngInject("language")}</b>
      <br>
      Hola señor !`;
  $("#ecoBtn > p").innerHTML = `
      <b>${lngInject("ecoMode")}</b>
      <br>
      ${lngInject("ecoDescription")}`;
  $("#notifBtn > p").innerHTML = `
      <b>${lngInject("notifications")}</b>
      <br>
      ${lngInject("notifDescription")}`;
  $("#cacheBtn").innerHTML = `
        <p>
          <b>${lngInject("cache")}</b>
          <br>
          ${lngInject("cacheDescription")}
        </p>
        <button onclick="clearCache()" class="btn-accent"><i class="ph ph-trash"></i><b>${lngInject("empty")}</b></button>`;

  $A("#days-selector > div > label:nth-child(even)").forEach(function(day, index) {
    day.innerText = i18n.languages[selectedLng]["weekDays"][index];
  });
}



///////////////////////////
//         DEBUG         //
///////////////////////////

function debug() {
  // Welcome remove
  if (localStorage.getItem("welcomeRemove") === "true") {
    document.getElementById("welcomeRemove").checked = true;
    if (localStorage.getItem("currentStudentID")) {
      $("#welcome").remove();
      $("#nav-footer > div:first-of-type > button:first-of-type").remove();
      console.log("Welcome removed");
    }
  } else {
    if (localStorage.getItem("currentStudentID")) {
      $("#welcome").style.display = "none";
      console.log("Welcome still present");
    }
  }
  
  document.getElementById("welcomeRemove").addEventListener("change", function () {
    if (this.checked) {
      localStorage.setItem("welcomeRemove", true);
      if (localStorage.getItem("currentStudentID")) {
        $("#welcome").remove();
        $("#nav-footer > div:first-of-type > button:first-of-type").remove();
        console.log("Welcome removed");
      }
    } else {
      localStorage.setItem("welcomeRemove", false);
      if (localStorage.getItem("currentStudentID")) {
        console.log("Welcome re-enabled, please restart");
      }
    }
  });
  
  
  // Welcome debug button remove
  if (localStorage.getItem("welcomeDebugRemove") === "true") {
    document.getElementById("welcomeDebugRemove").checked = true;
    if (localStorage.getItem("currentStudentID")) {
      $("#welcomeDebug").remove();
      console.log("Welcome debug removed");
    }
  } else {
    if (localStorage.getItem("currentStudentID")) {
      console.log("Welcome debug still present");
    }
  }
  
  document.getElementById("welcomeDebugRemove").addEventListener("change", function () {
    if (this.checked) {
      localStorage.setItem("welcomeDebugRemove", true);
      if (localStorage.getItem("currentStudentID")) {
        $("#welcomeDebug").remove();
        console.log("Welcome debug removed");
      }
    } else {
      localStorage.setItem("welcomeDebugRemove", false);
      if (localStorage.getItem("currentStudentID")) {
        console.log("Welcome debug re-enabled, please restart");
      }
    }
  });
}