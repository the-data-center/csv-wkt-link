#!/bin/bash

#if run from this folder
node ../index.js --coordinatesfile example/assets.csv --pointfile-wkt-field geo --polyfile example/neighborhood-associations-geo.csv --polyfile-wkt-field the_geom --fields OrgName
