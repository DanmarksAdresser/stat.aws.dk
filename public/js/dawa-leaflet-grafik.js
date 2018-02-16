"use strict"

var dawaois= require('./dawa-ois-koder.js');

var defaultpointstyle = {
  "stroke": false,
  "husnr": false,
  "color": "red",
  "opacity": 1.0,
  "weight": 1, 
  "fill": true,
  "fillColor": 'red',
  "fillOpacity": 1.0,
  "husnr": false,
  "radius": 5
};

var bygningpointstyle = {
  "stroke": false,
  "husnr": false,
  "color": "blue",
  "opacity": 1.0,
  "weight": 1, 
  "fill": true,
  "fillColor": 'blue',
  "fillOpacity": 1.0,
  "husnr": false,
  "radius": 5
};

var tekniskeanlaegpointstyle = {
  "stroke": false,
  "husnr": false,
  "color": "black",
  "opacity": 1.0,
  "weight": 1, 
  "fill": true,
  "fillColor": 'black',
  "fillOpacity": 1.0,
  "husnr": false,
  "radius": 5
};

var defaultpolygonstyle = {
  "stroke": true,
  "color": "blue",
  "opacity": 1.0,
  "weight": 2, 
  "fill": true,
  "fillColor": 'blue',
  "fillOpacity": 0.2,
  "husnr": false, 
  "radius": 5
};

var defaultlinestyle = {
  "stroke": true,
  "color": "blue",
  "opacity": 1.0,
  "weight": 2, 
  "fill": false,
  "fillColor": 'blue',
  "fillOpacity": 0.2,
  "husnr": false, 
  "radius": 5
};



exports.eachFeature= 
  function (showpopup) {
    return function (feature, layer) {
      var popup;
      if ("ejerlavkode" in feature.properties && "matrikelnr" in feature.properties && !("vejnavn" in feature.properties)) {      
        popup= layer.bindPopup("Jordstykke: " + feature.properties.ejerlavkode + " " + feature.properties.matrikelnr);
      }
      else if ("type" in feature.properties && "navn" in feature.properties) {  
        popup= layer.bindPopup(feature.properties.navn + " (" + feature.properties.type + ")");
      }
      else if ("kode" in feature.properties && "navn" in feature.properties) {  
        popup= layer.bindPopup(feature.properties.kode + " " + feature.properties.navn);
      }
       else if ("nr" in feature.properties && "navn" in feature.properties) {  
        popup= layer.bindPopup(feature.properties.nr + " " + feature.properties.navn);
      }
      else if ("vejnavn" in feature.properties && "husnr" in feature.properties && "etage" in feature.properties) {  
        popup= layer.bindPopup("<a target='_blank' href='https://dawa.aws.dk/adresser/"+feature.properties.id+"'>"+feature.properties.vejnavn + " " + feature.properties.husnr + ", " + (feature.properties.supplerendebynavn?feature.properties.supplerendebynavn+", ":"") + feature.properties.postnr + " " + feature.properties.postnrnavn + "</a>");
      }
      else if ("vejnavn" in feature.properties && "husnr" in feature.properties) {  
        popup= layer.bindPopup("<a target='_blank' href='https://dawa.aws.dk/adgangsadresser/"+feature.properties.id+"'>"+feature.properties.vejnavn + " " + feature.properties.husnr + ", " + (feature.properties.supplerendebynavn?feature.properties.supplerendebynavn+", ":"") + feature.properties.postnr + " " + feature.properties.postnrnavn + "</a>");
      }
      else if ("Tekniskanlaeg_id" in feature.properties) {  
        popup= layer.bindPopup("<a target='_blank' href='https://dawa.aws.dk/ois/tekniskeanlaeg?id="+feature.properties.Tekniskanlaeg_id+"'>"+dawaois.klassifikationskoder[feature.properties.Klassifikation] + " etableret " + feature.properties.Etableringsaar + "</a>");
      }
      else if ("Bygning_id" in feature.properties) {  
        popup= layer.bindPopup("<a target='_blank' href='https://dawa.aws.dk/ois/bygninger?id="+feature.properties.Bygning_id+"'>"+dawaois.anvendelseskoder[feature.properties.BYG_ANVEND_KODE] + " fra " + feature.properties.OPFOERELSE_AAR + "</a>");
      }
      if (showpopup) popup.openPopup();
    }
  }

exports.pointToLayer= function (style) {
  return function(feature, latlng) {
    if (style.husnr) {
      return L.marker(latlng, {icon: L.divIcon({className: "labelClass", html: feature.properties.husnr})});
    }
    else {
      return L.circleMarker(latlng, style);
    }
  }
}

exports.getDefaultStyle= function (data) {
  var featureData= data;
  if (data.type !== 'Feature') {
    featureData= data.features[0];
  }
  var defaultstyle;
  if (featureData.geometry && featureData.geometry.type==='Point' && featureData.properties.Tekniskanlaeg_id) {
    defaultstyle= tekniskeanlaegpointstyle;
  }
  else if (featureData.geometry && featureData.geometry.type==='Point' && featureData.properties.Bygning_id) {
    defaultstyle= bygningpointstyle;
  }
  else if (featureData.geometry && featureData.geometry.type==='Point') {
    defaultstyle= defaultpointstyle;
  }
  else if (featureData.geometry && featureData.geometry.type==='MultiPolygon') {

    defaultstyle= defaultpolygonstyle; 
  }
  else {
    defaultstyle= defaultlinestyle;
  }
  return defaultstyle;
}
