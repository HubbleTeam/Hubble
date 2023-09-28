///////////////////////////
//        THEMES         //
///////////////////////////

async function startup() {
  // read the theme from localStorage (runs only one time)
  const selectedTheme = localStorage.getItem("selectedTheme");
  
  // initialize elements
  const pickers = $("#color-pickers");
  const themeRadios = document.getElementsByName("theme-switch");
  

  // fill the theme dropdown with appropriate values
  for (const key of Object.keys(db.colorSchemes)) {
    let option = document.createElement("option");
    option.text = db.colorSchemes[key].name;
    option.value = key;
    $("#theme-select").appendChild(option);
  }
  
  
  
  
  
  
  
  
  
  
  
  
  
  // --- FONTS ---
  
  // find Google Fonts in the document
  function findGoogleFonts() {
    const linkElements = document.querySelectorAll('link[rel="stylesheet"]');
    const fontFamilies = [];

    linkElements.forEach((link) => {
      const href = link.getAttribute('href');
      const match = href.match(/family=([^&]+)/);
      if (match) {
        const fontFamily = match[1].replace(/\+/g, ' ').split(':wght')[0];
        fontFamilies.push(fontFamily);
      }
    });
    
    fontFamilies.push("Comic Sans MS");

    return fontFamilies;
  }

  const googleFonts = findGoogleFonts();
  
  // populate the font selector
  googleFonts.forEach((fontName) => {
      const option = document.createElement("option");
      option.value = fontName;
      option.textContent = fontName;
      $("#font-selector").appendChild(option);
  });
  
  // change font on theme dropdown value change
  $("#font-selector").addEventListener("change", function () {
    console.log(this.value);
    document.body.style.setProperty("font", `1rem ${this.value}, sans-serif`);
  });
  
  
  
  
  
  
  
  
  
  
  $("#bg-picker-revert").addEventListener("click", function() {
    localStorage.removeItem("custBgColor");
    $("#bg-picker").value = db.colorSchemes[localStorage.getItem("selectedTheme")].bgColor;
  });
  
  $("#accent-picker-revert").addEventListener("click", function() {
    localStorage.removeItem("custAccentColor");
    $("#accent-picker").value = db.colorSchemes[localStorage.getItem("selectedTheme")].accentColor;
  });
  
  $("#text-picker-revert").addEventListener("click", function() {
    localStorage.removeItem("custTextColor1");
    $("#text-picker").value = db.colorSchemes[localStorage.getItem("selectedTheme")].textColor1;
  });
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  
  // change theme on theme dropdown value change
  $("#theme-select").addEventListener("change", function () {
    changeTheme(this.value);
    console.log(this.value);
  });

  // change theme on nav menu theme radio change
  for (const element of themeRadios) {
      element.addEventListener("change", function () {
      changeTheme(this.value)
    });
  }
  
  
  // initialize custom theme color pickers
  const custompicker = [
    { element: $("#bg-picker"), variable: "--bg-color" },
    { element: $("#accent-picker"), variable: "--accent-color" },
    { element: $("#text-picker"), variable: "--text-color-1" },
  ];

  // change custom theme color variables on input
  custompicker.forEach(function (custompicker) {
    custompicker.element.addEventListener("input", function () {
      updateAll(custompicker.variable);
    }, false);
  });

  themesWelcome();
  updateInit(selectedTheme);
}

function themeSelectorTemplate(themeName, bgColor, accentColor) {
  return `<div style="background: ${bgColor};">
            <header>
              <div style="background: ${accentColor};">

              </div>
            </header>

            <main>
              <section></section>
              <section>
                <div class="entry">
                  <p class="lesson-hour"><b></b><br></p>
                  <div>
                    <p class="lesson-title"><b></b></p>
                    <div class="lesson-details">
                      <div>
                        <i class="ph-fill ph-student"></i>
                        <p></p>
                      </div>
                      <div>
                        <p></p>
                        <hr>
                        <p></p>
                      </div>       
                    </div>
                  </div>
                </div>
              </section>
            </main>
          </div>

          <p>${themeName}</p>`;
}

function themesWelcome() {
  for (const key of Object.keys(db.colorSchemes)) {
    let holder = document.createElement('div');
    
    let themeName = db.colorSchemes[key].name;
    
    if (key === "systemTheme") {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        holder.innerHTML = themeSelectorTemplate(themeName, db.colorSchemes["darkTheme"].bgColor, db.colorSchemes["darkTheme"].accentColor);
      } else {
        holder.innerHTML = themeSelectorTemplate(themeName, db.colorSchemes["lightTheme"].bgColor, db.colorSchemes["lightTheme"].accentColor);
      }
    } else {
      holder.innerHTML = themeSelectorTemplate(themeName, db.colorSchemes[key].bgColor, db.colorSchemes[key].accentColor);
    }
    
    $(".themess").appendChild(holder);
  }
}


function changeTheme(value) {
  if (value === "systemTheme") {
    $("#systemRadio").checked = true;
  } else if (value === "darkTheme") {
    $("#darkRadio").checked = true;
  } else {
    $("#lightRadio").checked = true;
  }
  
  $("#theme-select").value = value;
  
  if (value === "systemTheme") {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      updateInit("darkTheme");
    } else {
      updateInit("lightTheme");
    }
  } else {
    updateInit(value);
  }
  
  localStorage.setItem("selectedTheme", value);
}


async function updateInit(theTheme) {
  let selectedTheme = theTheme || "lightTheme";

  $("#bg-picker").value = localStorage.getItem("custBgColor") || db.colorSchemes[selectedTheme].bgColor;
  $("#accent-picker").value = localStorage.getItem("custAccentColor") || db.colorSchemes[selectedTheme].accentColor;
  $("#text-picker").value = localStorage.getItem("custTextColor1") || db.colorSchemes[selectedTheme].textColor1;
  rootElm.style.setProperty("--bg-color", db.colorSchemes[selectedTheme].bgColor);
  rootElm.style.setProperty("--accent-color", db.colorSchemes[selectedTheme].accentColor);
  rootElm.style.setProperty("--text-color-1", db.colorSchemes[selectedTheme].textColor1);
}


// convert css variables name to camelCase for localStorage
function updateAll(property) {
  if (localStorage.getItem("selectedTheme") !== "customTheme") {
    changeTheme("customTheme");
  }
  
  let replaced = property.replace(/[-]{1,2}([a-z0-9])/g, function (s, group1) {
    return group1.toUpperCase();
  });

  rootElm.style.setProperty(property, event.target.value);
  localStorage.setItem(`cust${replaced}`, event.target.value);
}