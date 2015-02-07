Package.describe({
    name: "mondora:versioned-collection",
    summary: "Versioned collections for meteor",
    version: "0.1.0",
    git: "https://github.com/mondora/mondora-versioned-collection.git"
});

Package.onUse(function (api) {
    // Supported Meteor versions
    api.versionsFrom("METEOR@0.9.0");
    // Exports
    api.export("VersionedCollection", "server");
    // Package files
    api.addFiles([
        "src/utils.js",
        "src/methods.js",
        "src/rule-engine.js",
        "src/versioned-collection.js"
    ], "server");
});

Package.onTest(function (api) {
    // Test dependencies
    api.use("underscore");
    api.use("tinytest");
    // Package files
    api.addFiles([
        "src/utils.js",
        "src/methods.js",
        "src/rule-engine.js",
        "src/versioned-collection.js"
    ], "server");
    // Test files
    api.addFiles([
        "test/methods.unit.js",
        "test/rule-engine.unit.js",
        "test/utils.unit.js",
        "test/versioned-collection.unit.js"
    ], "server");
});

Npm.depends({
    "ramda": "0.9.1",
    "jsondiffpatch": "0.1.27",
    "sinon": "1.12.2"
});
