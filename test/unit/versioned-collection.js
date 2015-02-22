var R     = Npm.require("ramda");
var sinon = Npm.require("sinon");

/*
*   VersionedCollection.prototype.constructor
*/

Tinytest.add("VersionedCollection - constructor - constructor", function (test) {
    // BEFORE
    sinon.stub(Mongo, "Collection");
    sinon.stub(VersionedCollection.prototype, "_registerMethods");
    sinon.stub(rulesEngine, "setupRulesEngine");
    // TEST
    var vc = new VersionedCollection("name", "schema");
    test.isTrue(Mongo.Collection.calledWith("name"));
    test.isTrue(Mongo.Collection.calledWithNew());
    test.equal(vc._schema, "schema");
    test.isTrue(VersionedCollection.prototype._registerMethods.called);
    test.isTrue(rulesEngine.setupRulesEngine.calledWith(vc));
    // AFTER
    Mongo.Collection.restore();
    VersionedCollection.prototype._registerMethods.restore();
    rulesEngine.setupRulesEngine.restore();
});

/*
*   VersionedCollection.prototype._registerMethods
*/

Tinytest.add("VersionedCollection - _registerMethods - registration", function (test) {
    // BEFORE
    var instance = {
        _name: "collectionName"
    };
    sinon.stub(Meteor, "methods");
    // TEST
    VersionedCollection.prototype._registerMethods.call(instance);
    test.isTrue(Meteor.methods.called);
    var meteorMethods = Meteor.methods.firstCall.args[0];
    test.isTrue(R.has("VersionedCollection:collectionName:insert", meteorMethods));
    test.isTrue(R.has("VersionedCollection:collectionName:commit", meteorMethods));
    // AFTER
    Meteor.methods.restore();
});

/*
*   VersionedCollection.prototype.allow
*/

Tinytest.add("VersionedCollection - allow - proxy", function (test) {
    // BEFORE
    sinon.stub(rulesEngine, "registerRules");
    var instance = {};
    var ruleSet = {};
    // TEST
    VersionedCollection.prototype.allow.call(instance, ruleSet);
    test.isTrue(rulesEngine.registerRules.calledWith(instance, "allow", ruleSet));
    // AFTER
    rulesEngine.registerRules.restore();
});

/*
*   VersionedCollection.prototype.deny
*/

Tinytest.add("VersionedCollection - deny - proxy", function (test) {
    // BEFORE
    sinon.stub(rulesEngine, "registerRules");
    var instance = {};
    var ruleSet = {};
    // TEST
    VersionedCollection.prototype.deny.call(instance, ruleSet);
    test.isTrue(rulesEngine.registerRules.calledWith(instance, "deny", ruleSet));
    // AFTER
    rulesEngine.registerRules.restore();
});

/*
*   VersionedCollection.prototype.find
*/

Tinytest.add("VersionedCollection - find - proxy", function (test) {
    // BEFORE
    var instance = {
        _collection: {
            find: sinon.spy()
        }
    };
    var selector = {};
    var options = {};
    // TEST
    VersionedCollection.prototype.find.call(instance, selector, options);
    test.isTrue(instance._collection.find.calledWith(selector, options));
});

/*
*   VersionedCollection.prototype.findOne
*/

Tinytest.add("VersionedCollection - findOne - proxy", function (test) {
    // BEFORE
    var instance = {
        _collection: {
            findOne: sinon.spy()
        }
    };
    var selector = {};
    var options = {};
    // TEST
    VersionedCollection.prototype.findOne.call(instance, selector, options);
    test.isTrue(instance._collection.findOne.calledWith(selector, options));
});

/*
*   VersionedCollection.prototype.insert
*/

Tinytest.add("VersionedCollection - insert - schema check", function (test) {
    // BEFORE
    sinon.stub(Match, "test", R.F);
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    var postLatest = {a: "a"};
    var insert = VersionedCollection.prototype.insert.bind(instance, "", postLatest, "");
    // TEST
    test.throws(insert, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Latest after commit doesn't match schema, aborting"
        );
    });
    // AFTER
    Match.test.restore();
});

Tinytest.add("VersionedCollection - insert - call _collection.insert", function (test) {
    // BEFORE
    sinon.stub(Match, "test", R.T);
    var instance = {
        _collection: {
            insert: sinon.spy()
        }
    };
    hooksEngine.setupHooksEngine(instance);
    var postLatest = {a: "a"};
    // TEST
    VersionedCollection.prototype.insert.call(instance, "", postLatest, "");
    test.isTrue(instance._collection.insert.called);
    // AFTER
    Match.test.restore();
});

/*
*   VersionedCollection.prototype.commit
*/

Tinytest.add("VersionedCollection - commit - schema check", function (test) {
    // BEFORE
    sinon.stub(Match, "test", R.F);
    var instance = {
        _collection: {
            findOne: R.always({
                latest: {}
            })
        }
    };
    hooksEngine.setupHooksEngine(instance);
    var postLatest = {a: "a"};
    var insert = VersionedCollection.prototype.commit.bind(instance, "", "", postLatest, "");
    // TEST
    test.throws(insert, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Latest after commit doesn't match schema, aborting"
        );
    });
    // AFTER
    Match.test.restore();
});

Tinytest.add("VersionedCollection - commit - call _collection.update", function (test) {
    // BEFORE
    sinon.stub(Match, "test", R.T);
    var instance = {
        _collection: {
            update: sinon.spy(),
            findOne: R.always({
                latest: {}
            })
        }
    };
    hooksEngine.setupHooksEngine(instance);
    var postLatest = {a: "a"};
    // TEST
    VersionedCollection.prototype.commit.call(instance, "", "", postLatest, "");
    test.isTrue(instance._collection.update.called);
    // AFTER
    Match.test.restore();
});
