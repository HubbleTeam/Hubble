const express = require('express')
const axios = require('axios')
const path = require('node:path')
const ical = require('node-ical')
const sass = require('sass');
const fs = require('node:fs');
const QuotedPrintable = require('@ronomon/quoted-printable');
const { start } = require('node:repl');
const app = express();

const httpsPort = 443;
const instance = axios.create({baseURL: 'https://www.gpu-lr.fr/'})
const localStringOpt = {hour: "numeric", minute: "numeric", timeZone:'Europe/Paris'}

async function login(id, password) {
  const form = {'util': id, 'acct_pass': password, 'modeconnect': 'connect'};

  const url = 'sat/index.php?page_param=accueilsatellys.php';
  const cookies = await instance.post(url, form, { 
    headers: { 
      'Content-Type' : 'application/x-www-form-urlencoded'
    }
  }).then( ({ headers }) => headers['set-cookie'].join("; ") );
  return cookies;
};

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



function arrange(json) {
  let new_json = {};
  let previousSession = {};
  let objectArr = [];
  for (const [uid, session] of Object.entries(json)) {
    let session_json = {};
   
    if (!uid.match(/^[\d-]*$/))
    {
      continue;
    }
    
    session_json.day = new Date(session.dtstamp).getDate();
    session_json.isLesson = true;
  
    const start = new Date(session.start);
    previousSession.start = start;
    session_json.start = start.toLocaleTimeString('fr-FR', localStringOpt);
  
    const end = new Date(session.end);
    previousSession.end = end;
    session_json.end = end.toLocaleTimeString('fr-FR', localStringOpt);
      
      //session_json.duration = new Date(end-start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
    const bufferEncoded = Buffer.from(session.description.val, 'ascii');
    const buffer = QuotedPrintable.decode(bufferEncoded, { qEncoding: false });
    const desc = buffer.toString('utf-8');
    const regexp = /\b.*?:(?<values>.*?(?=(\s[^\s]*?:)|\\))/g;
    const decoded_desc = Array.from(desc.matchAll(regexp), m => m.groups.values);
    session_json.room = decoded_desc[0];

    if (session.summary.toLowerCase().includes('autonomie') &&         
        !decoded_desc[1]) {
    session_json.prof = "TP Autonomie";
    }else{
    session_json.prof = decoded_desc[1];
    }
    session_json.spe = decoded_desc[2];
    new_json[session_json.day] = new_json[session_json.day] ?? [];
   
    new_json[session_json.day].push(session_json);

            // tri par heure de début
    for (let day in new_json) {
      new_json[day].sort(compareSessionsByStartTime);
    }
        
  }

  for (let day in new_json) {
    let sessions = new_json[day];
    for (let i = 0; i < sessions.length; i++) {
      let session = sessions[i];
      if (i === 0) {
        // Si c'est la première session de la journée, on ne crée pas de pause déjeuner
        continue;
      }
      let previousSession = sessions[i-1];
      if (session.start >= "13:45" && previousSession.end < "13:45") {
        // Si la session actuelle commence après 13h45 et la session précédente se termine avant 13h45, on crée une pause déjeuner
        let pause = {};
        pause.isLesson = false;
        pause.start = previousSession.end;
        pause.end = "13:45";
        new_json[day].splice(i, 0, pause); // On ajoute la pause déjeuner dans le tableau
        i++; // On incrémente i car on a ajouté un élément dans le tableau et on veut continuer avec la session suivante
      }
    }
    // Si la dernière session de la journée se termine avant 13h45, on ajoute une pause déjeuner à la fin de la journée
    let lastSession = sessions[sessions.length - 1];
    if (lastSession.end < "13:45") {
      let pause = {};
      pause.isLesson = false;
      pause.start = lastSession.end;
      pause.end = "13:45";
      new_json[day].push(pause); // On ajoute la pause déjeuner à la fin du tableau
    }
  }

  

// on enregistre new_json dans un fichier json
  const jsonString = JSON.stringify(new_json);
  fs.writeFileSync('data.json', jsonString);

  for(let day in new_json)
  {
     objectArr = Object.entries(new_json); // transform object to array tuple
  
  objectArr = objectArr.sort((tupleA, tupleB) => {
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
  }

  return Object.values(objectArr);

}

//   const jsonString = JSON.stringify(new_json);

// fs.writeFileSync('data.json', jsonString);
//   console.log("=================================")

app.use(express.static(path.join(__dirname, 'public'), {index: false}));


app.get('/', function(req, res) {
  const css = sass.compile('./styles/style.scss', {style: "compressed"}).css;
  fs.writeFileSync('./public/styles/style.css', css);
  res.sendFile(path.join(__dirname, './public/index.html'));
});


app.get('/edt.json', express.json(), async function(req, res) {
  const password = req.query.passwd || '123';
  //console.log(password, req.query.passwd);
  const cookies = await login(req.query.id, password);
  
  let url = 'gpu/index.php';
  await instance.get(url, {
    headers: { 
      'Cookie': cookies 
    }
  });

  url = `gpu/gpu2vcs.php?semaine=${req.query.week}&prof_etu=ETU&etudiant=${req.query.id}&enseignantedt=`
  const json = await instance.get(url, {
    headers: { 
      'Cookie': cookies 
    }
  }).then( ({data}) => ical.async.parseICS(data) );
  const arranged_json = arrange(json);
  res.send(arranged_json);
  //console.log("Json.summary: ", json.uid);
  //console.log("Json.location: ", json.location);
});

//Si autre que https alors redirection vers https
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://' + req.hostname + req.url);
  } else {
    next();
  }
});


// Route pour la page 404
app.use(function(req, res, next) {
  res.status(404);
  res.sendFile(path.join(__dirname, './public/404.html'));
});

app.listen(httpsPort, function() {
  console.log(`Listening on port ${httpsPort}!`);
})

/*const key = fs.readFileSync('./certs/localhost.key');
const cert = fs.readFileSync('./certs/localhost.crt');

const server = https.createServer({ key: key, cert: cert }, app);

app.use((req, res, next) => {
  if (!req.secure) {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
})*/

/*server.listen(httpsPort, function() {
  console.log(`Listening on port ${httpsPort}!`)
})*/


// fs.readFile('./public/settings.json', 'utf8', (err, jsonString) => {
//     if (err) {
//         console.log("Error reading file from disk:", err)
//         return
//     }
//     try {
//         const customer = JSON.parse(jsonString)
//         console.log(customer)
//     } catch(err) {
//         console.log('Error parsing JSON string:', err)
//     }
// })