#!/usr/bin/env node

const csv = require('csvtojson')
const wktParse = require('wellknown');
const turfBooleanPointInPolygon = require('@turf/boolean-point-in-polygon').default;
const turfIntersect = require('@turf/intersect').default;
const yargs = require('yargs');
const version = require('./package.json').version;
//command line help
const argv = yargs
.usage('Link two CSV files by geographic coordinates (WKT format)')
.example('$0 -c example/assets.csv -k geo -p example/neighborhood-associations-geo.csv -q the_geom -f OrgName')
.example('')
.example('$0 --coordinatesfile example/assets.csv --pointfile-wkt-field geo --polyfile example/neighborhood-associations-geo.csv --polyfile-wkt-field the_geom --fields OrgName')
.alias('p', 'polyfile').describe('p', 'CSV file with WKT Polygons and GEOID in the properties')
.alias('q', 'polyfile-wkt-field').describe('q', 'Fieldname for the poly file WKT field (default: geometry)')
.alias('c', 'coordinatesfile').describe('c', 'CSV with coordinates/points')
.alias('k', 'pointfile-wkt-field').describe('k', 'Fieldname for the point file WKT field (default: geometry)')
.array('f').alias('f', 'fields').describe('f', 'Fields to match, separated by a space (default: GEOID)')
.boolean('r').alias('r', 'reverse').describe('r', 'Copy the data from the point data to the polygon data instead')
.wrap(yargs.terminalWidth())
.demandOption(['f','p','q','c','k'])
.version(version).alias('version','v')
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
      polyData.forEach(function(f) {
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
      });
      csv().fromFile(argv.c).then((pointData) => {
        var pointFeatureCollection = {
          "type": "FeatureCollection",
          "features": []
        }
        pointData.forEach(function(f) {
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
          fields: argv.f || ['GEOID'],
          reverse: argv.r,
          sync: true
        }, function(err, newFile) {
          if (err && err.length) console.error(err);
          else {
            let rows = [];
            let data = newFile.features;

            data.forEach(function(row) {
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
  var points = [...new Set(pointGeoJSON.features)];
  var polies = [...new Set(polyGeoJSON.features)];

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
      let isIn = false;
      if (point.geometry.type == "Point") {
        isIn = turfBooleanPointInPolygon(point, poly);
      } else {
        isIn = turfIntersect(point,poly);
      }
      if (isIn) {
        if (typeof fields === "string") {
          fields = [fields];
        }
        fields.forEach(function(fname) {
          if (options.reverse) {
            if (poly.properties[fname] && typeof poly.properties[fname] === "string") {
              poly.properties[fname] = poly.properties[fname].split(',')
            } else if (poly.properties[fname]) {
              poly.properties[fname].push(point.properties[fname]);
              poly.properties[fname] = [...new Set(poly.properties[fname])]
            } else {
              poly.properties[fname] = [point.properties[fname]];
            }
          } else {
            if (point.properties[fname] && typeof point.properties[fname] === "string") {
              point.properties[fname] = point.properties[fname].split(',')
            } else if (point.properties[fname]) {
              point.properties[fname].push(poly.properties[fname]);
              point.properties[fname] = [...new Set(point.properties[fname])]
            } else {
              point.properties[fname] = [poly.properties[fname]];
            }
          }
        });
        fields.forEach(function(fname) {
          if (options.reverse) {
            if (poly.properties[fname] && poly.properties[fname].length) {
              poly.properties[fname] = poly.properties[fname].join(',')
            }
          } else {
            if (point.properties[fname] && point.properties[fname].length) {
              point.properties[fname] = point.properties[fname].join(',')
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
