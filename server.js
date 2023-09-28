const path = require("node:path");
const fs = require("node:fs");
const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const ical = require("node-ical");
const sass = require("sass");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const replace = require("replace-in-file");
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const httpsRedirect = require('express-https-redirect');
const app = express();

//SECURITY STUFF
// app.use(helmet.xssFilter());
// app.use(helmet.frameguard({ action: 'deny' }));
// app.use(helmet.noSniff());
//app.use(cors());



require("dotenv").config();

// ENV PORT
const httpsPort = process.env.PORT;

const currentVersion = "1.0-beta";

const instance = axios.create({ baseURL: "https://www.gpu-lr.fr/" });
const localStringOpt = {
  hour: "numeric",
  minute: "numeric",
  timeZone: "Europe/Paris",
};

// Configuration du transporter Nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_MAIL,
    pass: process.env.EMAIL_PASS,
  },
});

async function login(id, password) {
  const form = { util: id, acct_pass: password, modeconnect: "connect" };

  const url = "sat/index.php?page_param=accueilsatellys.php";
  const cookies = await instance
    .post(url, form, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then(({ headers }) => headers["set-cookie"].join("; "));
  return cookies;
}

function compareEvents(event1, event2) {
  const dtstamp1 = new Date(event1.dtstamp);
  const dtstamp2 = new Date(event2.dtstamp);
  return dtstamp1.getTime() - dtstamp2.getTime();
}

function compareSessionsByStartTime(session1, session2) {
  const time1 = new Date(`01/01/2000 ${session1.start}`);
  const time2 = new Date(`01/01/2000 ${session2.start}`);
  return time1 - time2;
}

// Fonction pour générer les pauses déjeuner
function generateLunchBreaks(new_json) {
  for (let day in new_json) {
    let sessions = new_json[day];
    let previousSession = sessions[0];
    for (let session of sessions.slice(1)) {
      if (session.start >= "13:10" && previousSession.end < "13:45") {
        let pause = {
          type: "lunchBreak",
          start: previousSession.end,
          end: "13:45",
        };
        new_json[day].splice(sessions.indexOf(session), 0, pause);
      }
      previousSession = session;
    }
    if (sessions[sessions.length - 1].end < "13:45") {
      let pause = {
        type: "lunchBreak",
        start: sessions[sessions.length - 1].end,
        end: "13:45",
      };
      new_json[day].push(pause);
    }
  }
}

// Fonction pour générer les pauses café
function generateCoffeeBreaks(new_json) {
  for (let day in new_json) {
    let sessions = new_json[day];
    let previousSession = sessions[0];
    for (let session of sessions.slice(1)) {
      let sessionStart = new Date("1970-01-01T" + session.start + ":00"); // Convert to Date object
      let previousSessionEnd = new Date(
        "1970-01-01T" + previousSession.end + ":00"
      ); // Convert to Date object
      let timeDifference = (sessionStart - previousSessionEnd) / (1000 * 60); // Time difference in minutes
      if (timeDifference >= 10) {
        let coffeeBreak = {
          type: "coffeeBreak",
          start: previousSessionEnd.toISOString().substr(11, 5), // Convert date to "HH:mm" format
          end: session.start,
        };
        new_json[day].splice(sessions.indexOf(session), 0, coffeeBreak);
      }
      previousSession = session;
    }
  }
}

function getWeekDayNumbers(actualWeek) {
  const date = new Date(2023, 0, 1 + (actualWeek - 1) * 7 + 1);
  const result = {};
  for (let i = 0; i < 7; i++) {
    result[i] = date.getDate();
    date.setDate(date.getDate() + 1);
  }
  return result;
}

function arrange(json) {
  console.log(json)
  let new_json = {};
  let previousSession = {};
  let objectArr = [];
  const weekDays = getWeekDayNumbers(actualWeek);
  const daysOfWeek = Object.values(weekDays);

  for (const [uid, session] of Object.entries(json)) {
    let session_json = {};

    if (!uid.match(/^[\d-]*$/)) {
      continue;
    }

    session_json.day = new Date(session.dtstamp).getDate();
    session_json.type = "lesson";

    const start = new Date(session.start);
    previousSession.start = start;
    session_json.start = start.toLocaleTimeString("fr-FR", localStringOpt);

    const end = new Date(session.end);
    previousSession.end = end;
    session_json.end = end.toLocaleTimeString("fr-FR", localStringOpt);

    const desc = decodeURIComponent(
      session.description.val.replace(/=([0-9A-F]{2})/g, "%$1")
    );
    const regexp = /\b.*?:(?<values>.*?(?=(\s[^\s]*?:)|\\))/g;
    const decoded_desc = Array.from(
      desc.matchAll(regexp),
      (m) => m.groups.values
    );
    session_json.room = decoded_desc[0];
    const splitSummary = session.summary.split(" / ");
    session_json.lessonType = splitSummary[1];
    session_json.prof = decoded_desc[1];
    session_json.spe = decoded_desc[2];
    new_json[session_json.day] = new_json[session_json.day] ?? [];

    new_json[session_json.day].push(session_json);

    for (let day in new_json) {
      new_json[day].sort(compareSessionsByStartTime);
    }
  }

  //génère pause repas
  generateLunchBreaks(new_json);
  //génère pause café
  generateCoffeeBreaks(new_json);

    // Ajoute des tableaux vides pour les jours sans cours
    for (const dayNumber of daysOfWeek) {
      
      if (!new_json[dayNumber]) {
        new_json[dayNumber] = [];
      }
    }

  // Tri les jours de la semaine par ordre croissant
  objectArr = Object.entries(new_json).sort((tupleA, tupleB) => {
    // the key is probably a string at this point
    const keyA = parseInt(tupleA[0]);
    const keyB = parseInt(tupleB[0]);

    if (keyA >= 23 && keyB < 7) {
      return -1;
    } else if (keyA < 7 && keyB >= 23) {
      return 1;
    }
    return keyA - keyB;
  });

  console.log(objectArr)
  return Object.values(objectArr);
}



app.use(bodyParser.json()); // Middleware pour traiter les données JSON dans la requête

app.use(express.static(path.join(__dirname, 'public'), {index: false}));

app.get('/', function (req, res) {
  const css = sass.compile("./styles/style.scss", { style: "compressed" }).css;
  console.log("Compiled CSS 👍");
  fs.writeFileSync("./public/styles/style.css", css);
  res.sendFile(path.join(__dirname, "./public/index.html"));
});

let actualWeek = null;
app.get("/edt", express.json(), async function (req, res) {
  const password = req.query.passwd || "123"; // récupère le mot de passe ou utilise une valeur par défaut

  // utiliser le mot de passe dans votre code
  const cookies = await login(req.query.id, password);

  let url = "gpu/index.php";
  await instance.get(url, {
    headers: {
      Cookie: cookies,
    },
  });

  url = `gpu/gpu2vcs.php?semaine=${req.query.week}&prof_etu=ETU&etudiant=${req.query.id}&enseignantedt=`;
  const json = await instance
    .get(url, {
      headers: {
        Cookie: cookies,
      },
    })
    .then(({ data }) => ical.async.parseICS(data));
  actualWeek = req.query.week;
  const arranged_json = arrange(json);
  res.send(arranged_json);
});

app.get("/getName", express.json(), async function (req, res) {
  const password = req.query.passwd || "123";
  const cookies = await login(req.query.id, password);

  const targetUrl = "gpu/index.php?page_param=fpetudiant.php&cat=0&numpage=1&niv=2&clef=/10192/10194/";
  instance
    .get(targetUrl, {
      headers: {
        Cookie: cookies,
      },
    })
    .then((response) => {
      const html = response.data;
      const $ = cheerio.load(html);
      const nameElement = $("div.Titre2G + span.Police1");
      const name = nameElement.text().replace(/^\d+\s/, '');
      res.send({ name: name });
    })
    .catch((error) => {
      console.error(error);
    });
});

const black_list = require('./black-list.json');

app.get('/getIDBlackList', function (req, res) {
  res.json(black_list);
})


app.get("/version", (req, res) => {
  res.send(currentVersion);
});

app.post("/sendReport", async (req, res) => {
  // Route pour la requête POST
  const receivedData = req.body; // Récupérer les données du corps de la requête
  console.log("Données reçues :", receivedData); // Afficher les données reçues dans la console
  console.log("mail:", req.body.email);

  const email = req.body.email;
  const sujet = req.body.sujet;
  const description = req.body.description;
  const name = req.body.studentName;

  // Lire le contenu du fichier mailBody.html
  const mailBodyPath = "mailBody.html";
  let mailBody = fs.readFileSync(mailBodyPath, { encoding: "utf8" });

  // Remplacer les variables par leurs valeurs correspondantes
  mailBody = mailBody.replace(/\${name}/g, name);
  mailBody = mailBody.replace(/\${email}/g, email);
  mailBody = mailBody.replace(/\${sujet}/g, sujet);
  mailBody = mailBody.replace(/\${description}/g, description);

  // Utiliser le contenu mis à jour du fichier pour le champ 'html'
  const mailOptions = {
    from: process.env.EMAIL_MAIL,
    to: process.env.EMAIL_MAILRECIPENT,
    subject: sujet,
    html: mailBody,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send("Erreur lors de l'envoi de l'e-mail");
    } else {
      console.log(email, sujet, description);
      console.log("E-mail envoyé : " + info.response);
      // Modifier la réponse pour renvoyer un message de confirmation
      res.send("message bien envoyé");
    }
  });
});



app.listen(httpsPort, function () {
  console.log(`Listening on port ${httpsPort}!`);
});