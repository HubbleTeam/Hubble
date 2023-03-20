const filesToLoad = ['./html/sidepanel.html', './html/settings.html', './html/about.html', './html/welcome.html', './html/splash-screen.html'];
let loadingFiles = [];
for (const file of filesToLoad) {
  loadingFiles.push(fetch(file).then(res => res.text()).then(html => {
    document.body.innerHTML = html + document.body.innerHTML;
    return;
  }));
}

Promise.all(loadingFiles).then(() => {
  if (document.readyState == "loading")
  {
    document.addEventListener('DOMContentLoaded', init, false);
  } else {
    init();
  }
})

let splashScreen, sidepanelMenu, sidepanelBg, header, aboutPanel, welcomePanel, settingsPanel, input, mainContent, themeSelector, daysSelector, weekSelector, defaultDay, weekIndicator, idCounter;

async function init() {
  splashScreen = document.getElementById("splash-screen");
  sidepanelMenu = document.getElementById("sidebar");
  header = document.getElementById("header");
  aboutPanel = document.getElementById("about");
  welcomePanel = document.getElementById("welcome");
  settingsPanel = document.getElementById("settings");
  input = document.getElementById("avatar");
  mainContent = document.getElementById("main-content");
  themeSelector = document.getElementById("theme-select");
  daysSelector = document.getElementById('days-selector');
  weekSelector = document.getElementById('week-selector');
  weekIndicator = document.getElementById("week-indicator");
  defaultDay = document.querySelector("#days-selector > div:nth-child(1) > input");
  startup();
  input.addEventListener('change', updateImageDisplay);
  daysSelector.addEventListener('change', (event) => {
    event.stopPropagation();
    const week = parseInt(weekSelector.dataset.week)
    fetchEdt(event.target.value, week);
  });
  const invalidCredidential = await invalidCreditentials();
  if (invalidCredidential)
  {
    await saveCreditentials();
  }
  navigator.onLine ? online() : offline();
}

window.onscroll = function() {shrinkHeader()};

function assignIdentifier(){
        var identifiant = document.getElementById("identifiant").value;
        identifiant = identifiant.replace(/[^0-9]/g, '');
        if (identifiant.length > 6) {
          identifiant = identifiant.substring(0, 6);
        }
        console.log("Identifiant saisi: " + identifiant);
      }
let currentVersion = "19/03/2023"
function checkForNewVersion() {
  fetch('./version.txt', { cache: "no-cache" })
    .then(response => response.text())
    .then(version => {
      if (version !== currentVersion) {
        document.getElementById('version').textContent = version;
        currentVersion = version;
        alert(`Nouvelle version disponible (${version}), maj au relancement de l'application`);
        caches.keys().then(function(names) {
          for (let name of names) caches.delete(name);
        });
      }
    });
}



function getCurrentDate() {
  const currentDate = new Date();
  const startDate = new Date(currentDate.getFullYear(), 0, 1);
  const days = Math.floor((currentDate - startDate) /
    (24 * 60 * 60 * 1000));
  const week = Math.ceil(days / 7);
  const day = currentDate.getDay() ? currentDate.getDay() - 1 : 0;
  return { day, week };
}

function getMaxWeeks(year) {
  const firstDayOfYear = new Date(year, 0, 1);
  const lastDayOfYear = new Date(year, 11, 31);
  return Math.floor((lastDayOfYear - firstDayOfYear) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

async function weekDecrement() {
  let week = parseInt(weekSelector.dataset.week)
  if (week > 1) {
    week--;
  } else {
    const previousYear = new Date().getFullYear()-1;
    week = getMaxWeeks(previousYear)-1;
  }
  weekSelector.dataset.week = week;
  defaultDay.checked = true;
  await fetchEdt(0, week);
  weekIndicator.innerText = `Semaine ${week}`;
  updateDaysOfWeek(`${week}`);
}

async function weekIncrement() {
  let week = parseInt(weekSelector.dataset.week)
  const previousYear = new Date().getFullYear()-1;
  if (week < getMaxWeeks(previousYear)-1) {
    week++;
  } else {
    week = 1;
  }
  weekSelector.dataset.week = week;
  defaultDay.checked = true;
  await fetchEdt(0, week);
  weekIndicator.innerText = `Semaine ${week}`;
  updateDaysOfWeek(`${week}`);
}

function getWeekDayNumbers(weekNumber) {
  const date = new Date();
  date.setFullYear(2023, 0, 1);
  date.setDate(2 + (weekNumber - 1) * 7);
  const result = {};
  for (let i = 0; i < 7; i++) {
    result[i] = date.getDate();
    date.setDate(date.getDate() + 1);
  }
  return result;
}

function updateDaysOfWeek(weekNumber) {
  const daysOfWeek = getWeekDayNumbers(weekNumber);
  const labels = document.querySelectorAll('#days-selector label b');
  for (let i = 0; i < labels.length; i++) {
    labels[i].textContent = daysOfWeek[i];
  }
}



///////////////////////////
//        RENDER         //
///////////////////////////

function activeHour(lesson) {
  const element = document.getElementById(`idC${idCounter}`);
  const now = new Date(); 
  const dayNb = now.getDate()
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const currentTime = `${hours}:${minutes}`;
  const startHour = lesson.start;
  const endHour = lesson.end;
  const day = lesson.day;
  
  if (currentTime >= startHour && currentTime < endHour && dayNb == day) {
    element.classList.add('lesson-in-progress');
    element.classList.remove('inactive');
  } else {
    element.classList.add('inactive');
    element.classList.remove('lesson-in-progress');
  }
}


function generatePause(pause) {
  return `<div class="disabled" id="idC${idCounter}">
            <p><b>${pause.start}</b><br>${pause.end}</p>
            <div>
              <p>Pause repas</p>
            </div>
          </div>`;
}

function generateLesson(lesson) {
  return `<p class="inactive" id="idC${idCounter}"><b>${lesson.start}</b><br>${lesson.end}</p>
          <div>
            <div>
              <i class="ph-fill ph-student"></i>
            </div>
            <div>
              <p><b>${lesson.spe}</b></p>
              <p>${lesson.prof}</p>
              <p>${lesson.room}</p>
            </div>
          </div>`;
}

const urlParams = new URLSearchParams(window.location.search);
const password = urlParams.get('password') || '123'; 
async function fetchEdt(day, week, weekNumber) {
  const array = await fetch(`/edt.json?id=219671&week=${week}`)
    .then(reponse => reponse.json());
  const mainContent = document.getElementById("main-content");
  if (!mainContent) {
    console.error("L'élément main-content est introuvable.");
    return;
  }
  mainContent.innerHTML = "<div id=line></div>"; 
  idCounter = 0;
  if (array[day]) {
    for (const session of array[day][1]) {
      const entry = document.createElement('div');
      entry.className = 'entry';
      if (session.isLesson) {
        idCounter += 1;
        entry.innerHTML = generateLesson(session);
      } else {
        idCounter += 1;
        entry.innerHTML = generatePause(session);
      }
      
      mainContent.appendChild(entry);
      activeHour(session);
      // Ajout de la mise en cache de la ligne de code
      const cacheName = 'HubbleCacheV1';
      const cache = await caches.open(cacheName);
    }
  } else {
    const nolesson = document.createElement("p");
    nolesson.innerHTML = 'Aucun cours';
    mainContent.appendChild(nolesson);
    nolesson.style.textAlign = "center";
    document.getElementById("line").style.display = "none";
  }
}




async function online() {
  const { day, week } = getCurrentDate();
  weekSelector.dataset.week = week;
  if (`${day}` == 6) {
    const currentDayInput = document.querySelector(`input.day[value="5"]`);
    currentDayInput.checked = true;
  } else{
    const currentDayInput = document.querySelector(`input.day[value="${day}"]`);
    currentDayInput.checked = true;
  }
  await fetchEdt(day, week);
  weekIndicator.innerText = `Semaine ${week}`;
  updateDaysOfWeek(`${week}`);
  
  splashScreen.style.opacity = "0";
  setTimeout(() => {
    splashScreen.style.display = "none";
  }, 1000)
  checkForNewVersion();
}

async function offline() {
  splashScreen.style.opacity = "0";
  setTimeout(() => {
    splashScreen.style.display = "none";
  }, 1000)
}



function closeAll() {
  sidepanel('close');
  settingsSwitch('close');
  aboutSwitch('close');
  welcomeSwitch('close');
}



///////////////////////////
//        SIDEBAR        //
///////////////////////////

function sidepanel(act) {
  if (act == 'open') {
    sidepanelMenu.style.left = '10%';
    bgOpacity('open')
  } else if (act == 'flyoutclose') {
    sidepanelMenu.style.left = '100%';
  } else if (act == 'close') {
    sidepanelMenu.style.left = '100%';
    bgOpacity('sidepanelclose');
  }
}

/* Toggle between showing and hiding the navigation menu links when the user clicks on the hamburger menu / bar icon */
function nav() {
  var x = document.getElementById("myLinks");
  if (x.style.display === "block") {
    x.style.display = "none";
    bgOpacity('close');
  } else {
    x.style.display = "block";
    bgOpacity('open');
  }
}

function bgOpacity(act) {
  if (act == 'open') {
    document.getElementById("bg").style.opacity = "1";
    document.getElementById("bg").style.zIndex = "2";
    document.getElementById("bg").style.bottom = "0";
  } else if (act == 'close') {
    document.getElementById("bg").style.bottom = "100%";
    setTimeout(() => {
      document.getElementById("bg").style.zIndex = "-1";
      document.getElementById("bg").style.opacity = "0";
    }, 500)
  }
}



///////////////////////////
//      HEADER ANIM      //
///////////////////////////

function shrinkHeader() {
  if (document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
    header.style.height = "48px";
  } else {
    header.style.height = "60px";
  }
}



///////////////////////////
//    SETTINGS SWITCH    //
///////////////////////////

function settingsSwitch(act) {
  if (act == 'open') {
    settingsPanel.style.top = "10%";
    bgOpacity('open');
    sidepanel('flyoutclose');
  } else if (act == 'close') {
    settingsPanel.style.top = "100%";
    bgOpacity('close');
  }
}

function aboutSwitch(act) {
  if (act == 'open') {
    aboutPanel.style.top = "10%";
    bgOpacity('open');
    sidepanel('flyoutclose');
  } else if (act == 'close') {
    aboutPanel.style.top = "100%";
    bgOpacity('close');
  }
}

function welcomeSwitch(act) {
  if (act == 'open') {
    welcomePanel.style.top = "10%";
    bgOpacity('open');
    sidepanel('flyoutclose');
  } else if (act == 'close') {
    welcomePanel.style.top = "100%";
    bgOpacity('open');
  }
}



///////////////////////////
//        PICKER         //
///////////////////////////

async function startup() {
  var r = document.querySelector(':root');
  let bgPicker;
  let accentPicker;
  let textPicker;

  const jsonsettings = await fetch('./settings.json')
      .then(settings => settings.json());

  for (const key of Object.keys(jsonsettings.colorSchemes)) {
    var option = document.createElement("option");
    option.text = `${key}`;
    option.value = `${key}`;
    themeSelector.appendChild(option);
  }

  var selectedTheme = themeSelector.value;
  
  themeSelector.addEventListener('change', function(event) {
    var selectedTheme = themeSelector.value;
    bgPicker.value = jsonsettings.colorSchemes[selectedTheme].bgColor
    accentPicker.value = jsonsettings.colorSchemes[selectedTheme].accentColor
    textPicker.value = jsonsettings.colorSchemes[selectedTheme].textColor1
    r.style.setProperty('--bg-color', bgPicker.value);
    r.style.setProperty('--accent-color', accentPicker.value);
    r.style.setProperty('--text-color-1', textPicker.value);
  });

  bgPicker = document.getElementById("bg-picker");
  bgPicker.value = jsonsettings.colorSchemes[selectedTheme].bgColor
  bgPicker.addEventListener("change", updateAllBg, false);
  bgPicker.select();

  accentPicker = document.getElementById("accent-picker");
  accentPicker.value = jsonsettings.colorSchemes[selectedTheme].accentColor
  accentPicker.addEventListener("change", updateAllAccent, false);
  accentPicker.select();

  textPicker = document.getElementById("text-picker");
  textPicker.value = jsonsettings.colorSchemes[selectedTheme].textColor1
  textPicker.addEventListener("change", updateAllText, false);
  textPicker.select();

  r.style.setProperty('--bg-color', bgPicker.value);
  r.style.setProperty('--accent-color', accentPicker.value);
  r.style.setProperty('--text-color-1', textPicker.value);
}

function updateAllBg(event) {
  var r = document.querySelector(':root');
  
  r.style.setProperty('--bg-color', event.target.value);
}

function updateAllAccent(event) {
  var r = document.querySelector(':root');
  
  r.style.setProperty('--accent-color', event.target.value);
}

function updateAllText(event) {
  var r = document.querySelector(':root');
  
  r.style.setProperty('--text-color-1', event.target.value);
}



///////////////////////////
//    PROFILE PICTURE    //
///////////////////////////

function validFileType(file) {
  // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Image_types
  const fileTypes = [
    "image/apng",
    "image/bmp",
    "image/gif",
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/svg+xml",
    "image/tiff",
    "image/webp",
    "image/x-icon"
  ];
  
  return fileTypes.includes(file.type);
}

function updateImageDisplay() {

  const curFiles = input.files;
  if (curFiles.length === 0) {
    alert("ratio");
  } else {
    for (const file of curFiles) {
      if (validFileType(file)) {
        const image = document.querySelector('.pp');
        image.src = URL.createObjectURL(file);
      } else {
        alert("ratio");
      }
    }
  }
}



// ///////////////////////////
// //      EASTER EGG       //
// ///////////////////////////

// var image = document.getElementById("headericon");
// var lien = document.getElementById("eggs");
// let compteur;

// image.addEventListener("click", function() {
//   compteur++;
// if (compteur > 10) {
//     lien.textContent = "Et vive, vive, vive les gros nichons Les paires de seins comme des ballons En pomme, en poire, ovales ou ronds Faut du volume sous le téton Et vive, vive, vive les gros nichons Les paires de seins comme des ballons Tant qu'il y aura du monde au balcon Ça boug'ra dans les pantalons!";
//   }
// });

// var image = document.getElementById("troll");
// var audio = new Audio('assets/clickpa/song.mp3');

// image.addEventListener("click", function() {
//     audio.play();
//     audio.volume = 0.1;
// });

async function invalidCreditentials() {
   return window.localStorage.studentId !== 'undefined';
}

async function saveCreditentials() {
  /*const studentId = window.prompt("Votre numéro d'étudiant :")
  window.localStorage.studentId = studentId;*/
  persistData();
}


async function persistData() {
  if (navigator.storage && navigator.storage.persist) {
    const result = await navigator.storage.persist();
    console.log(`Data persisted: ${result}`);
  }
}


///////////////////////////
//    PULL TO REFRESH    //
///////////////////////////

const CACHE_NAME = 'HubbleCacheV1';

//DEBUG FUNCTION
function clearHubbleCache() {
  caches.delete(CACHE_NAME)
    .then(() => {
      console.log('Cache cleared successfully.');
    })
    .catch(error => {
      console.error('Error clearing cache:', error);
    });
}

function refreshCache() {
  return new Promise((resolve, reject) => {
    caches.open(CACHE_NAME)
      .then(cache => {
        cache.keys().then(keys => {
          // Créer un tableau de promesses pour supprimer les fichiers avec le nom 'edt.json'
          const deletePromises = keys.filter(key => key.url.includes('edt.json')).map(key => cache.delete(key));
          // Attendre que toutes les promesses de suppression soient résolues
          Promise.all(deletePromises).then(() => {
            // Résoudre la promesse principale
            resolve();
          }).catch(error => {
            // Rejeter la promesse principale en cas d'erreur
            reject(error);
          });
        });
      });
  });
}

PullToRefresh.init({
  mainElement: 'body',
  async onRefresh() {
    const { day, week } = getCurrentDate();
    await refreshCache();
    await console.log(week, day);
    await fetchEdt(day, week);
  }
});




if ('Notification' in window) {
  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        sendNotification();
      }
    });
  } else if (Notification.permission === 'granted') {
    sendNotification();
  }
}

function sendNotification() {
  let notificationCount = 0;
  const intervalId = setInterval(() => {
    notificationCount++;
    const notification = new Notification(`Notification ${notificationCount}`, {
      body: `This is notification number ${notificationCount}.`,
    });
    if (notificationCount === 5) {
      clearInterval(intervalId);
    }
  }, 60 * 1000); // Send notification every minute (in milliseconds)
}


/*
// Vérifier si les notifications sont prises en charge par le navigateur
if ("Notification" in window) {
  // Cacher le bouton si les notifications sont déjà autorisées
  if (Notification.permission === "granted") {
    document.getElementById("notification-btn").style.display = "none";
  }
  // Sinon, ajouter un écouteur d'événement pour afficher la boîte de dialogue de demande de permission
  else {
    document.getElementById("notification-btn").addEventListener("click", function() {
      Notification.requestPermission().then(function(permission) {
        if (permission === "granted") {
          // Cacher le bouton si l'utilisateur a autorisé les notifications
          document.getElementById("notification-btn").style.display = "none";
          alert("Les notifications sont activées !");
        }
      });
    });
  }
}

if ("Notification" in window) {
    // Vérifier si les notifications sont autorisées
    if (Notification.permission === "granted") {
      // Envoyer la première notification immédiatement
      var notification1 = new Notification("Notification 1 !");
      console.log("notif 1");
      // Attendre 15 secondes avant d'envoyer la deuxième notification
      setTimeout(function() {
        var notification2 = new Notification("Notification 2 !");
        console.log("notif 2");
      }, 15000);
      // Attendre 30 secondes avant de fermer les notifications
      setTimeout(function() {
        notification1.close();
        notification2.close();
      }, 30000);
    }
}*/