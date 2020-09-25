// IMPORTANT: Replace the apikey with your own from https://developer.here.com
let apiKey = 'gu2xI9YN1IE6pyN2NXUWHy-cilUtvePc9tKShlNwCY0';

// Step 1: Create a basic map and set up the HERE platform
var platform = new H.service.Platform({
  apikey: apiKey
});
var defaultLayers = platform.createDefaultLayers();

var map = new H.Map(document.getElementById('map'),
  defaultLayers.raster.satellite.map, {
  pixelRatio: window.devicePixelRatio || 1
});

window.addEventListener('resize', () => map.getViewPort().resize());
var behavior = new H.mapevents.Behavior(new H.mapevents.MapEvents(map));
var ui = H.ui.UI.createDefault(map, defaultLayers);

// Step 2: Calculate a route to get a list of marker positions
function calculateRouteFromAtoB(platform) {
  let router = platform.getRoutingService();
  let routeRequestParams = {
    mode: 'shortest;car',
    representation: 'display',
    routeattributes: 'shape',
    waypoint0: '19.68976,-155.46648',
    waypoint1: '19.82185,-155.47435',
    // request altitudes for positions
    returnElevation: true
  };

  router.calculateRoute(
    routeRequestParams,
    onSuccess,
    onError
  );
}


function onSuccess(result) {

  let routeLineString = new H.geo.LineString();
  let routeShape = result.response.route[0].shape;
  let group = new H.map.Group();
  let polyline;

  // Step 3: find minimum and maximum altitudes
  let minAltitude = 9999;
  let maxAltitude = -9999;

  routeShape.forEach(function (point) {
    let splits = point.split(',');
    if (splits[2] < minAltitude) minAltitude = splits[2];
    if (splits[2] > maxAltitude) maxAltitude = splits[2];
  });

  routeShape.forEach(function (point) {

    let splits = point.split(','); // lat, long, altitude
    routeLineString.pushLatLngAlt(splits[0], splits[1]);

    // Step 4: create RGB color in hex for SVG
    var scale = (splits[2] - minAltitude) / (maxAltitude - minAltitude);
    var red = Math.round(255 * scale);
    var red = red.toString(16);
    if (red.length == 1) {
      red = '0' + red;
    }

    var green = Math.round(255 - 255 * scale);
    var green = green.toString(16);
    if (green.length == 1) {
      green = '0' + green;
    }
    let blue = "00";
    let color = '#' + red + green + blue;
    console.log(color);

    let svg = '<svg height="10" width="10" xmlns="http://www.w3.org/2000/svg"><circle cx="5" cy="5" r="4" fill="{$COLOR}" /></svg>';
    svg = svg.replace('{$COLOR}', color);

    // Step 5: Create markers with altitude
    let altitudeIcon = new H.map.Icon(svg);
    let altitudeMarker = new H.map.Marker(
      {
        lat: splits[0],
        lng: splits[1],
        alt: splits[2]
      },
      { icon: altitudeIcon }
    );
    group.addObject(altitudeMarker);
  });

  polyline = new H.map.Polyline(routeLineString, {
    style: {
      lineWidth: 5,
      strokeColor: '#00AFAA'
    }
  });

  // Add the polyline to the map
  map.addObject(polyline);
  // Add markers to the map
  map.addObject(group);
  // Zoom to its bounding rectangle
  map.getViewModel().setLookAtData({
    bounds: polyline.getBoundingBox(),
    tilt: 50
  });
}

/**
 * This function will be called if a communication error occurs during the JSON-P request
 * @param  {Object} error  The error message received.
 */
function onError(error) {
  alert('Routing error: ' + error);
}


calculateRouteFromAtoB(platform);

