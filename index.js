#!/usr/bin/env node

const csv = require('csvtojson')
const wktParse = require('wellknown');
const _ = require('lodash');
const turfBooleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;

const version = require('./package.json').version;
//command line help
const argv = require('yargs')
.usage('Link two CSV files by geographic coordinates (WKT format)')
.example('$0 -c example/assets.csv -k geo -p example/neighborhood-associations-geo.csv -q the_geom -f OrgName')
.example('')
.example('$0 --coordinatesfile example/assets.csv --pointfileWKTfield geo --polyfile example/neighborhood-associations-geo.csv --polyfileWKTfield the_geom --fields OrgName')
.alias('p', 'polyfile').describe('p', 'CSV file with WKT Polygons and GEOID in the properties')
.alias('q', 'polyfileWKTfield').describe('q', 'Fieldname for the poly file WKT field (default: geometry)')
.alias('c', 'coordinatesfile').describe('c', 'GeoJSON with coordinates/points to be given correct GEOID. (If it has polygons, the centroid will be used)')
.alias('k', 'pointfileWKTfield').describe('k', 'Fieldname for the point file WKT field (default: geometry)')
.array('f').alias('f', 'fields').describe('f', 'Comma separated fields to match (default: GEOID)')
.boolean('r').alias('r', 'reverse').describe('r', 'Copy the data from the point to the polygon instead')
.demandOption(['f','p','q','c','k'])
.version(version)
.help('h').alias('h', 'help').showHelpOnFail(true)
.argv;

if (require.main == module) {
  //command line
  if (argv.p && argv.c) {
    csv().fromFile(argv.p).then((polyData) => {
      var featureCollection = {
        "type": "FeatureCollection",
        "features": []
      }
      _.each(polyData, function(f) {
        var geom = wktParse(f[argv.q] || f.geometry);
        var props = f;
        delete props.geometry;
        if (geom) {
          featureCollection.features.push({
            "type": "Feature",
            "geometry": geom,
            "properties": props
          })
        }
      })
      csv().fromFile(argv.c).then((pointData) => {
        var pointFeatureCollection = {
          "type": "FeatureCollection",
          "features": []
        }
        _.each(pointData, function(f) {
          var geom = wktParse(f[argv.k] || f.geometry);
          var props = f;
          delete props.geometry;
          if (geom) {
            pointFeatureCollection.features.push({
              "type": "Feature",
              "geometry": geom,
              "properties": props
            })
          }
        })
        match({
          polyfile: featureCollection,
          coordinatesfile: pointFeatureCollection,
          fields: argv.f.split(',') || ['GEOID'],
          reverse: argv.r,
          sync: true
        }, function(err, newFile) {
          if (err && err.length) console.error(err);
          else {
            let rows = [];
            let data = newFile.features;

            data.forEach(function(row) {
              if (row.geometry && row.geometry.type == "Point" && row.geometry.coordinates && row.geometry.coordinates.length > 1) {
                row.properties.lng = row.geometry.coordinates[0]
                row.properties.lat = row.geometry.coordinates[1]
              }
              rows.push(row.properties)
            })
            const items = rows;
            const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
            const header = Object.keys(items[0])
            let csv = items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
            csv.unshift(header.join(','))
            csv = csv.join('\r\n')
            console.log(csv);
          }
        });
      })
    })
  }
}

function match(options, callback) {
  var fields = options.fields;
  var polyGeoJSON = options.polyfile
  var pointGeoJSON = options.coordinatesfile;
  var err = [];
  var points = pointGeoJSON.features;
  var polies = polyGeoJSON.features;
  points.forEach(function(point) {
    if (typeof fields === "string") {
      fields = [fields];
    }
    fields.forEach(function(fname) {
      if (!point.properties[fname]) {
        point.properties[fname] = null;
      }
    })
    polies.forEach(function(poly) {
      var pt = point;
      var pol = poly;
      let isIn = turfBooleanPointInPolygon(pt, pol);
      if (isIn) {
        if (typeof fields === "string") {
          fields = [fields];
        }
        fields.forEach(function(fname) {
          if (options.reverse) {
            if (poly.properties[fname]) {
              poly.properties[fname] += ','+point.properties[fname];
            } else {
              poly.properties[fname] = point.properties[fname];
            }
          } else {
            if (point.properties[fname]) {
              point.properties[fname] += ','+poly.properties[fname];
            } else {
              point.properties[fname] = poly.properties[fname];
            }
          }
        })
      }
    })
  })
  if (typeof callback === "function") {
    if (options.reverse) {
      callback(err, polyGeoJSON);
    } else {
      callback(err, pointGeoJSON);
    }
  }
}
