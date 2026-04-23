const MODS = {
  outfit: [
    {
      metadata: require("./outfit/straight/metadata").default,
      module:   require("./outfit/straight/index")
    },
    {
      metadata: require("./outfit/purplewave/metadata").default,
      module:   require("./outfit/purplewave/index")
    },
    {
      metadata: require("./outfit/supergay/metadata").default,
      module:   require("./outfit/supergay/index")
    },
  ],
  extras: [
    {
      metadata: require("./extras/oneko/metadata").default,
      module:   require("./extras/oneko/index")
    },
    {
      metadata: require("./extras/sparktrail/metadata").default,
      module:   require("./extras/sparktrail/index")
    }
  ]
};

exports.MODS = MODS;
