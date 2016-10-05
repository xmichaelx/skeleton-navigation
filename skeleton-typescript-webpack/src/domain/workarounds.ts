import {ObservatoryConfiguration} from "./observatory";
import {ObservatoryComponentConfiguration} from "./observatory";
import {ObservatoryStreamConfiguration} from "./observatory";
import {TypesMapping} from "./interfaces";

export function Configuration(conf): ObservatoryConfiguration {
  var oc = new ObservatoryConfiguration();

  oc.id = conf.id;
  oc.name = conf.name;
  oc.shortName = conf.shortName;
  oc.location = conf.location;
  oc.state = conf.state;

  if (!conf.type) {
    oc.type = "astronomical";
  }

  if (!conf.networks) {
    oc.networks = ["localhost", "management", "solaris", "cog", "ou"];
  }

  oc.components = new Array<ObservatoryComponentConfiguration>();
  if (conf.components) {
    conf.components.forEach(function (d) {

      var type = d.type.replace("http://sybillatechnologies.com/aoin/v0/", "");
      var name = type.charAt(0).toUpperCase() + type.slice(1);

      var groups: Array<string> = new Array<string>();

      if (!d.name) {
        d.name = name;
      }
      
      if (!d.groups || (Array.isArray(d.groups) && d.groups.length == 0)) {
        if (type.indexOf("hub") > -1) {
          groups.push("hubs");
        } else if (name.toLowerCase().indexOf("weather") > -1) {
          groups.push("environment");
        } else {
          groups.push("hardware");
        }
        d.groups = groups;
      } else {
        groups = d.groups;
      }

      var deviceConfiguration = null;
      if (d.hasOwnProperty("configuration")) {
        deviceConfiguration = d.configuration;
      }

      d.name = TypesMapping[d.type];

      var component = new ObservatoryComponentConfiguration(d.id, d.type, d.name, d.groups, deviceConfiguration);
      oc.components.push(component);
    });
  }

  oc.streams = new Array<ObservatoryStreamConfiguration>();
  if (conf.streams && conf.streams.length) {
    conf.streams.forEach(function (s) {
      s.src = s.src.replace("http://virtualabot.cloudapp.net:8083", "https://abot-stream-" + conf.id + ".azurewebsites.net");
      var stream = new ObservatoryStreamConfiguration(s.name, s.src, s.type, s.configuration);
      oc.streams.push(stream);
    });
  }

  return oc;
}

export function mergeConfigurations(localConf, relayConf) {
  relayConf.components.forEach((c) => {
    var localComponents = localConf.components.filter((l, i, a) => {
      return l.id == c.id;
    });

    if (localComponents && localComponents.length) {
      var lc = localComponents[0];
      if (lc.configuration && c.configuration) {
        for (var prop in lc.configuration) {
          if (lc.configuration.hasOwnProperty(prop) && !c.configuration.hasOwnProperty(prop)) {
            c.configuration[prop] = lc.configuration[prop];
          }
        }
      } else if (lc.configuration && !c.configuration) {
        c.configuration = lc.configuration; 
      }
    }
  }); 

  relayConf.streams.forEach((s) => {
    var localStreams = localConf.streams.filter((l, i, a) => {
      return l.name == s.name; // @todo: there should be also id for streams
    });

    if (localStreams && localStreams.length) {
      var ls = localStreams[0];
      if (ls.configuration && s.configuration) {
        for (var prop in ls.configuration) {
          if (ls.configuration.hasOwnProperty(prop) && !s.configuration.hasOwnProperty(prop)) {
            s.configuration[prop] = ls.configuration[prop];
          }
        }
      } else if (ls.configuration && !s.configuration) {
        s.configuration = ls.configuration;
      }
    }
  });
}

