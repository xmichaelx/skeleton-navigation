export var Unit = {
  Degrees: "°",
  Celsius: "°C",
  Micron: "µm",
  Percent: "%",
  MPS: "m/s",
  KMS: "km/s",
  KMH: "km/h",
  Meters: "m",
  Meters_3: "m<sup>-3</sup>",
  Hours: "hrs",
  Minutes: "min",
  Seconds: "s",
  Lux: "lx",
  Rain: function(value) { 
    if (typeof value === 'string') {
      return value.toLowerCase() == "yes" ? "Raining" : "Not raining";
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return value ? 'Raining' : 'Not raining'
    }
  },
  Clouds: function(value) { 
    if (typeof value === 'string') {
      return value.toLowerCase() == "yes" ? 'Cloudy' : 'Clear sky';
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return value ? 'Cloudy' : 'Clear sky';  
    }
  },
  Bool: function(value) { 
    if (typeof value === 'string') {
      return value.toLowerCase() == "yes" ? "Yes" : "No";
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
  },
  None: ''
}
