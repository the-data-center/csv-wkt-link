#!/bin/bash

#if installed globally
node ../index.js --coordinatesfile assets.csv --pointfileWKTfield geo --polyfile neighborhood-associations-geo.csv --polyfileWKTfield the_geom --fields OrgName,Email > output.csv
