///////////////////////////
//      HEADER ANIM      //
///////////////////////////

window.onscroll = function () {
  if (document.body.scrollTop > 0 || document.documentElement.scrollTop > 0) {
    headerElm.style.padding = "2px 4px 2px 4px";
  } else {
    headerElm.style.height = "4px";
  }
};



///////////////////////////
//        SIDEBAR        //
///////////////////////////

/* Toggle between showing and hiding the navigation menu links when the user clicks on the hamburger menu / bar icon */
function nav(act) {
  const x = $("#myLinks");
  
  if (act == "open") {
    if (x.style.maxHeight == "500px") {
      x.style.maxHeight = "0";
      $("#header").style.backgroundColor = "var(--surface-color-1)";
      bgOpacity("close");
    } else {
      x.style.maxHeight = "500px";
      $("#header").style.backgroundColor = "var(--bg-color)";
      bgOpacity("open");
    }
  } else if (act == "flyoutclose") {
    x.style.maxHeight = "0";
    bgOpacity("flyoutopen");
  }
}



///////////////////////////
//        BG BLUR        //
///////////////////////////

function bgOpacity(act) {
  $("#bg");

  switch (act) {
    case "open":
      $("#bg").style.zIndex = "2";
      $("#bg").style.opacity = "1";
      // bg.style.top = "60px";
      break;
    case "close":
      $("#bg").style.opacity = "0";
      setTimeout(() => {
        $("#bg").style.zIndex = "-1";
      }, 500);
      // bg.style.top = "0";
      break;
    case "flyoutopen":
      // bg.style.top = "0";
      $("#bg").style.zIndex = "3";
      $("#bg").style.opacity = "1";
      break;
    default:
      console.error("Invalid argument");
  }
}



///////////////////////////
//     WELCOME SLIDE     //
///////////////////////////

let move = 0;

function welcomeNav(nav) {
  const welcomeElm = $("#welcome > div:first-of-type");
  move = nav === "left" ? move - 100 : move + 100;

  if (move > -400) {
    // Toggle disabled class on left arrow
    if (move === 0) {
        $("#welcome > div:last-of-type").style.opacity = 0;
        $("#welcome > div:last-of-type").style.pointerEvents = "none";
    } else {
      setTimeout(() => {
        $("#welcome > div:last-of-type").style.opacity = 1;
        $("#welcome > div:last-of-type").style.pointerEvents = "auto";
      }, "500");
    }

    if (move === -200) {
      assignIdentifier();
    }

    welcomeElm.style.transform = `translateX(${move}%)`;
  } else {
    $("#welcome").style.transform = "translateX(-100%)";
    const { week } = getCurrentDate();
    const radioDay = $('input[name="day"]:checked').value;
    fetchEdt(parseInt(radioDay), week);
    fetchName();
  }
}

const regexNb = /^\d+$/;
let isEmpty = true;
function handleInput(event) {
  const inputValue = event.target.value;
  if (regexNb.test(inputValue)) {
    isEmpty = false;
    $("#next-arrow").removeAttribute("disabled");
  } else {
    isEmpty = true;
    $("#next-arrow").setAttribute("disabled", "");
  }
}



///////////////////////////
//        SWITCHS        //
///////////////////////////

function switchPanel(panel, act) {
  if (panel === $("#welcome")) {
    panel.style.display = act === "open" ? "flex" : "none";
  } else {
    panel.style.top = act === "open" ? "50%" : "150%";
  }

  if (act == "open") {
    nav("flyoutclose");
  } else if (act == "close") {
    bgOpacity("close");
  }
}

function closeAll() {
  const panelsToClose = [
    $("#settings"),
    $("#about"),
    $("#welcome"),
    $("#report"),
  ];
  
  panelsToClose.forEach(function(panel) {
    switchPanel(panel, "close");
  });
}



///////////////////////////
//        SETTINGS       //
///////////////////////////

function moveThemeFlyout(act) {
//   let nb;
  
//   if (act === "open") {
//     nb = -100;
//   } else if (act === "debug") {
//     nb = -200;
//   } else {
//     nb = 0;
//   }

  document.querySelector("#settings > .flyout-page").style.marginLeft = `-${act}00%`;
  document.querySelector("#about > .flyout-page").style.marginLeft = `-${act}00%`;
}

function ecoMode() {
  if (localStorage.getItem("ecoMode") === "true") {
    document.getElementById("ecoMode").checked = true;
  }
  
  document.getElementById("ecoMode").addEventListener("change", function () {
    if (this.checked) {
      localStorage.setItem("ecoMode", true);
      $("#ecoCheck").checked = true;
      rootElm.style.setProperty("--blur-sm", "none");
      rootElm.style.setProperty("--blur-md", "none");
      rootElm.style.setProperty("--blur-lg", "none");
      rootElm.style.setProperty("--transition-short", "0s");
      rootElm.style.setProperty("--transition-normal", "0s");
    } else {
      localStorage.setItem("ecoMode", false);
      $("#ecoCheck").checked = false;
      rootElm.style.setProperty("--blur-sm", "blur(5px)");
      rootElm.style.setProperty("--blur-md", "blur(10px)");
      rootElm.style.setProperty("--blur-lg", "blur(20px)");
      rootElm.style.setProperty("--transition-short", "0.25s");
      rootElm.style.setProperty("--transition-normal", "0.5s");
    }
  });
}