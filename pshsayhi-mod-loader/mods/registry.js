const MODS = {
  outfit: [
    {
      metadata: require("./outfit/straight/metadata").default,
      module: require("./outfit/straight/index")
    },
    {
      metadata: require("./outfit/purplewave/metadata").default,
      module: require("./outfit/purplewave/index")
    },
    {
      metadata: require("./outfit/supergay/metadata").default,
      module: require("./outfit/supergay/index")
    },
    {
      metadata: require("./outfit/radioactive/metadata").default,
      module: require("./outfit/radioactive/index")
    },
    {
      metadata: require("./outfit/gold/metadata").default,
      module: require("./outfit/gold/index")
    },
    {
      metadata: require("./outfit/attentionseeker/metadata").default,
      module: require("./outfit/attentionseeker/index")
    },
    {
      metadata: require("./outfit/trafficlight/metadata").default,
      module: require("./outfit/trafficlight/index")
    },
    {
      metadata: require("./outfit/galaxy/metadata").default,
      module: require("./outfit/galaxy/index")
    },
    {
      metadata: require("./outfit/magma/metadata").default,
      module: require("./outfit/magma/index")
    },
    {
      metadata: require("./outfit/aurora/metadata").default,
      module: require("./outfit/aurora/index")
    },
  ],
  extras: [
    {
      metadata: require("./extras/oneko/metadata").default,
      module: require("./extras/oneko/index")
    },
    {
      metadata: require("./extras/sparktrail/metadata").default,
      module: require("./extras/sparktrail/index")
    },
    {
      metadata: require("./extras/bubbly/metadata").default,
      module: require("./extras/bubbly/index")
    },
  ]
};

exports.MODS = MODS;