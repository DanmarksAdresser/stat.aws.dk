"use strict";

var kort= require('dawa-kort')
  , moment = require('moment')
  , util= require('dawa-util');

var map;

function getMap() {
  return map;
}

var fra= moment(getQueryVariable('fra'),'YYYYMMDD');
if (!fra.isValid()) {
  alert('fra=' + getQueryVariable('fra') + ' er ikke en gyldig dato');
}

var til= moment(getQueryVariable('til'),'YYYYMMDD');
if (!til.isValid()) {
  alert('til=' + getQueryVariable('til') + ' er ikke en gyldig dato');
}
til.add({days: 1});


if (!fra.isBefore(til)) {
  alert('fra dato er senere end til dato');
}

var radius= getQueryVariable('radius');
if (typeof radius === 'undefined') {
  radius= 1;
}
else {
  radius= parseInt(radius);
}

console.log('radius: '+radius);

var update= getQueryVariable('update');
if (typeof update === 'undefined') {
  update= 100;
}
else {
  update= parseInt(update);
}
console.log('update: '+update);

var info = L.control();

info.onAdd = function (map) {
    this._div = L.DomUtil.create('div', 'info'); 
    this.update();
    return this._div;
};

var oprettede= 0
  , ændrede= 0
  , nedlagte= 0
  , total= 0
  , tid= "";

// method that we will use to update the control based on feature properties passed
info.update = function () {
    this._div.innerHTML = '<h3>Ajourføring af adgangsadresser</h3>'+
      '<p>' + fra.local().format('DD.MM.YYYY HH:mm:ss')  + ' - ' + til.local().format('DD.MM.YYYY HH:mm:ss') + '</p>' +
      '<p>Tidspunkt: ' + tid +
      '<p>' + oprettede + ' oprettede</p>' +
      '<p>' + ændrede + ' ændrede</p>' +
      '<p>' + nedlagte + ' nedlagte</p>';
      ;
  
};

var legend = L.control({position: 'bottomright'});

legend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend');

  
  div.innerHTML=
          '<p><i style="background: red"></i> Oprettet</p>' +
          '<p><i style="background: orange"></i> Ændret</p>' +
          '<p><i style="background: black"></i> Nedlagt</p>';

  return div;
};

var options= {
  contextmenu: true,
  contextmenuWidth: 140,
  contextmenuItems: [
  // {
  //   text: 'Koordinater?',
  //   callback: visKoordinater
  // },
  {
    text: 'Adgangsadresse?',
    callback: kort.nærmesteAdgangsadresse(getMap)
  },
  {
    text: 'Bygning?',
    callback: kort.nærmesteBygning(getMap)
  },
  {
    text: 'Vej?',
    callback: kort.nærmesteVejstykke(getMap)
  },
  {
    text: 'Hvor?',
    callback: kort.hvor(getMap)
  }
  // {
  //   text: 'Kommune?',
  //   callback: visKommune
  // }, '-',{
  //   text: 'Centrer kort her',
  //   callback: centerMap
  // }
  ]
};

function main() { 
  fetch('/getticket').then(function (response) {
    response.text().then(function (ticket) {
      options.baselayer= "Skærmkort - dæmpet";
      //options.preferCanvas= true;      
      map= kort.viskort('map', ticket, options);
      map.scrollWheelZoom.disable();
      info.addTo(map);
      legend.addTo(map);
      var center= kort.beregnCenter();
      map.setView(center,2);
      gennemløbhændelser(map);
    });
  });  
}

async function gennemløbhændelser(map) {
  // Forespøgelsel af hændelser spillets op i perioder for at undgå netværksproblemer ved en enkel forespørgelse med mange hændelser.
  var t1
    , t2= fra.clone();

  do {
    t1= t2;
    t2= t1.clone().add({days: 10});
    //console.log(t1.local().format('DD.MM.YYYY HH:mm:ss')  + ' - ' + t2.local().format('DD.MM.YYYY HH:mm:ss'));
    if (t2.isBefore(til)) {
      await enperiode(map,t1,t2);
    }
    else {
      await enperiode(map,t1,til);
      //console.log("Complete");
    }
  } while (t2.isBefore(til));
}

function enperiode (map, fra, til) {

  return new Promise((resolve, reject) => {
    let url = util.danUrl('http://dawa.aws.dk/replikering/adgangsadresser/haendelser', {tidspunktfra: fra.utc().toISOString(), tidspunkttil: til.utc().toISOString(), ndjson: true}); 
    //console.log(url);
    fetch(url).then(function (response) { //'?tidspunktfra=2014-11-28T18:59:02.045Z&tidspunkttil=2014-12-01T18:59:02.045Z&ndjson').then(function (response) {
      const reader= response.body.getReader();
      var result= new Uint8Array();

      reader.read().then(function processText({ done, value }) {

        if (done) {
          if (result.length > 0) {
            var linje= new TextDecoder("utf-8").decode(result);
            placerAdgangsadresse(map, linje);
          }
          //console.log("Stream complete");
          //alert("Stream complete");
          info.update();
          resolve()
          return;
        }
        var arr= new Uint8Array(result.length + value.length);
        arr.set(result);
        arr.set(value, result.length);
        result= arr;
        var p1= 0, p2;
        while ((p2= result.indexOf(10,p1)) != -1) {
          console.log()
          var linje= new TextDecoder("utf-8").decode(result.slice(p1,p2));
          p1= p2+1;
          placerAdgangsadresse(map, linje);
        };
        result= result.slice(p1);

        return reader.read().then(processText);
      });

    });  
  });
}

var adgangsadresserid;
function placerAdgangsadresse(map, linje) {
  total++;
  //console.log(linje);  
  var hændelse= JSON.parse(linje);
  tid= moment(hændelse.tidspunkt).local().format('DD.MM.YYYY HH:mm:ss');
  //console.log(hændelse);
  //if (!(placering.x || placering.y)) return; // find ud af hvorfor etrs89koordinat_øst i nogen tilfælde ændres til etrs89koordinat_��st
  //console.log(placering);
  var color;
  switch (hændelse.operation) {
    case 'insert':
      color= 'red';
      oprettede++;
      break;
    case 'update':
      color= 'orange';
      ændrede++;
      break;
    case 'delete':
      color= 'black';
      nedlagte++;
      break;
    }
  if (total%update === 0) info.update();
  if (hændelse.operation === 'update' && adgangsadresserid === hændelse.data.id) return;
  adgangsadresserid= hændelse.data.id;  
  var placering= kort.etrs89towgs84(hændelse.data.etrs89koordinat_øst,hændelse.data.etrs89koordinat_nord);
  var marker= L.circleMarker(L.latLng(placering.y, placering.x), {color: color, fillColor: color, stroke: true, fillOpacity: 1.0, radius: radius, weight: 2, opacity: 1.0}).addTo(map);//defaultpointstyle); 
}

function getQueryVariable(variable) {
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0; i<vars.length; i++) {
    var pair = vars[i].split("=");
    if (pair[0] == variable) {
      return pair[1];
    }
  }
}

main();

