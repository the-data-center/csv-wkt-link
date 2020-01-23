# CSV Data Link
A NodeJS library to link properties on two different GeoJSON files by determining if a geographic point is within a larger geographic region and linking the metadata. This project is sponsored by [The Data Center of Southeast Louisiana](https://www.datacenterresearch.org)

Link two CSV files by geographic coordinates (WKT format)

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
  -h, --help               Show help                                   [boolean]

Examples:
  node index.js -c example/assets.csv -k geo -p example/neighborhood-associations-geo.csv -q the_geom -f OrgName
  node index.js --coordinatesfile example/assets.csv --pointfileWKTfield geo --polyfile example/neighborhood-associations-geo.csv --polyfileWKTfield the_geom --fields OrgName
