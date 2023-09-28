// Load the JSON file as a module
import data from '../db.json' assert {type: 'json'};

// Parse the JSON data
const parsedData = JSON.parse(JSON.stringify(data));

// Use the parsed data
console.log(parsedData);

let selectedTheme;
let themeSelectorElm;
themeSelectorElm = document.getElementById("theme-select");

startup();


///////////////////////////
//        PICKER         //
///////////////////////////

function startup() {
  const db = parsedData;
  const pickers = document.querySelector("#theme-settings>div>div:not(:first-child)");

  for (const key of Object.keys(db.colorSchemes)) {
    let option = document.createElement("option");
    option.text = db.colorSchemes[key].name;
    option.value = key;
    themeSelectorElm.appendChild(option);
  } //cette partie c bon
  
  themeSelectorElm.addEventListener('change', function(){
    localStorage.setItem('selectedTheme', themeSelectorElm.value);
    darkSwitch.checked = (themeSelectorElm.value === "darkTheme") ? true : false;
    pickers.style.display = (themeSelectorElm.value === "custom") ? "block" : "none";
    updateInit();
  });

  darkSwitch.addEventListener('change', function(){
    darkSwitch.checked ? localStorage.setItem('selectedTheme', "darkTheme") : localStorage.setItem('selectedTheme', "lightTheme");
    
    updateInit();
  });
  
  bgPicker.addEventListener("input", function(){
    updateAll('--bg-color');
  }, false);
  
  accentPicker.addEventListener("input", function(){
    updateAll('--accent-color');
  }, false);
  
  textPicker.addEventListener("input", function(){
    updateAll('--text-color-1');
  }, false);

  

  updateInit();

  darkSwitch.checked = localStorage.getItem('selectedTheme') === "darkTheme" ? true : false;

}

function updateInit() {
  const db = parsedData;
  
  selectedTheme = localStorage.getItem('selectedTheme') || 'lightTheme';
  themeSelectorElm.value = selectedTheme;
  bgPicker.value = localStorage.getItem('custBgColor') || db.colorSchemes[selectedTheme].bgColor;
  accentPicker.value = localStorage.getItem('custAccentColor') || db.colorSchemes[selectedTheme].accentColor;
  textPicker.value = localStorage.getItem('custTextColor1') || db.colorSchemes[selectedTheme].textColor1;
  rootElm.style.setProperty('--bg-color', db.colorSchemes[selectedTheme].bgColor);
  rootElm.style.setProperty('--accent-color', db.colorSchemes[selectedTheme].accentColor);
  rootElm.style.setProperty('--text-color-1', db.colorSchemes[selectedTheme].textColor1);
}

function updateAll(property) {
  let replaced = property.replace(/[-]{1,2}([a-z0-9])/g, function(s, group1) {
    return group1.toUpperCase();
  });
  
  rootElm.style.setProperty(property, event.target.value);
  localStorage.setItem(`cust${replaced}`, event.target.value);
}