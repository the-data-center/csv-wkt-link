# CSV WKT Data Linker
A CLI tool for NodeJS that links properties on two different CSV files with a WKT geography field by determining if a geographic point is within a larger geographic region and then linking the rest of the data.

## About The Data Center
This project is sponsored by [The Data Center of Southeast Louisiana](https://www.datacenterresearch.org) [The Data Center](https://www.datacenterresearch.org) is a fully independent, data-focused non-profit with a mission to build prosperous, inclusive, and sustainable communities by making informed decisions possible. If you find this tool useful, please visit [our web site to learn more](https://www.datacenterresearch.org) about our work and consider [supporting us](https://www.datacenterresearch.org/support-us) in our mission.

##

Link two CSV files by geographic coordinates (WKT format)
```
Options:
  --version                Show version number                         [boolean]
  -p, --polyfile           CSV file with WKT Polygons and GEOID in the
                           properties
  -q, --polyfileWKTfield   Fieldname for the poly file WKT field (default:
                           geometry)
  -c, --coordinatesfile    GeoJSON with coordinates/points to be given correct
                           GEOID. (If it has polygons, the centroid will be
                           used)
  -k, --pointfileWKTfield  Fieldname for the point file WKT field (default:
                           geometry)
  -f, --fields             Comma separated fields to match (default: GEOID)
  -r, --reverse            Copy the data from the point to the polygon instead
  -h, --help               Show help                                   [boolean]

Examples:
  npx csv-wkt-link -c example/assets.csv -k geo -p example/neighborhood-associations-geo.csv -q the_geom -f OrgName

  npx csv-wkt-link --coordinatesfile example/assets.csv --pointfileWKTfield geo --polyfile example/neighborhood-associations-geo.csv --polyfileWKTfield the_geom --fields OrgName
```
