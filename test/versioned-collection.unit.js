var R     = Npm.require("ramda");
var sinon = Npm.require("sinon");

/*
*   VersionedCollection.prototype.constructor
*/

Tinytest.add("VersionedCollection - constructor - constructor", function (test) {
    // BEFORE
    sinon.stub(Mongo, "Collection");
    sinon.stub(VersionedCollection.prototype, "_registerMethods");
    sinon.stub(ruleEngine, "setupRuleEngine");
    // TEST
    var vc = new VersionedCollection("name", "schema");
    test.isTrue(Mongo.Collection.calledWith("name"));
    test.isTrue(Mongo.Collection.calledWithNew());
    test.equal(vc._schema, "schema");
    test.isTrue(VersionedCollection.prototype._registerMethods.called);
    test.isTrue(ruleEngine.setupRuleEngine.calledWith(vc));
    // AFTER
    Mongo.Collection.restore();
    VersionedCollection.prototype._registerMethods.restore();
    ruleEngine.setupRuleEngine.restore();
});

/*
*   VersionedCollection.prototype.allow
*/

Tinytest.add("VersionedCollection - allow - proxy", function (test) {
    // BEFORE
    sinon.stub(ruleEngine, "registerRules");
    var instance = {};
    var ruleSet = {};
    // TEST
    VersionedCollection.prototype.allow.call(instance, ruleSet);
    test.isTrue(ruleEngine.registerRules.calledWith(instance, "allow", ruleSet));
    // AFTER
    ruleEngine.registerRules.restore();
});

/*
*   VersionedCollection.prototype.deny
*/

Tinytest.add("VersionedCollection - deny - proxy", function (test) {
    // BEFORE
    sinon.stub(ruleEngine, "registerRules");
    var instance = {};
    var ruleSet = {};
    // TEST
    VersionedCollection.prototype.deny.call(instance, ruleSet);
    test.isTrue(ruleEngine.registerRules.calledWith(instance, "deny", ruleSet));
    // AFTER
    ruleEngine.registerRules.restore();
});

/*
*   VersionedCollection.prototype._runAllowRules
*/

Tinytest.add("VersionedCollection - _runAllowRules - one true", function (test) {
    // BEFORE
    sinon.stub(ruleEngine, "runRules", R.always([true, false]));
    // TEST
    var result = VersionedCollection.prototype._runAllowRules.call({});
    test.isTrue(result);
    // AFTER
    ruleEngine.runRules.restore();
});

Tinytest.add("VersionedCollection - _runAllowRules - zero true", function (test) {
    // BEFORE
    sinon.stub(ruleEngine, "runRules", R.always([false, false]));
    // TEST
    var result = VersionedCollection.prototype._runAllowRules.call({});
    test.isFalse(result);
    // AFTER
    ruleEngine.runRules.restore();
});

/*
*   VersionedCollection.prototype._runDenyRules
*/

Tinytest.add("VersionedCollection - _runDenyRules - one true", function (test) {
    // BEFORE
    sinon.stub(ruleEngine, "runRules", R.always([true, false]));
    // TEST
    var result = VersionedCollection.prototype._runDenyRules.call({});
    test.isTrue(result);
    // AFTER
    ruleEngine.runRules.restore();
});

Tinytest.add("VersionedCollection - _runDenyRules - zero true", function (test) {
    // BEFORE
    sinon.stub(ruleEngine, "runRules", R.always([false, false]));
    // TEST
    var result = VersionedCollection.prototype._runDenyRules.call({});
    test.isFalse(result);
    // AFTER
    ruleEngine.runRules.restore();
});

/*
*   VersionedCollection.prototype.insert
*/

Tinytest.add("VersionedCollection - insert - schema check", function (test) {
    // BEFORE
    sinon.stub(Match, "test", R.F);
    var delta = {a: ["a"]};
    var insert = VersionedCollection.prototype.insert.bind({}, "", delta, "");
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
    var delta = {a: ["a"]};
    // TEST
    VersionedCollection.prototype.insert.call(instance, "", delta, "");
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
    var delta = {a: ["a"]};
    var insert = VersionedCollection.prototype.commit.bind(instance, "", "", delta, "");
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

Tinytest.add("VersionedCollection - commit - call _collection.commit", function (test) {
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
    var delta = {a: ["a"]};
    // TEST
    VersionedCollection.prototype.commit.call(instance, "", "", delta, "");
    test.isTrue(instance._collection.update.called);
    // AFTER
    Match.test.restore();
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
