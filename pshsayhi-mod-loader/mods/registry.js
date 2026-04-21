const MODS = [
  {
    metadata: require("./straight/metadata").default,
    module:   require("./straight/index")
  },
  {
    metadata: require("./supergay/metadata").default,
    module:   require("./supergay/index")
  },
  {
    metadata: require("./oneko/metadata").default,
    module:   require("./oneko/index")
  },
  {
    metadata: require("./sparktrail/metadata").default,
    module:   require("./sparktrail/index")
  }
];

exports.MODS = MODS;
