var R     = Npm.require("ramda");
var sinon = Npm.require("sinon");

/*
*   insert method
*/

Tinytest.add("methods - insert - argument type checking", function (test) {
    // TEST
    test.throws(R.partial(methods.insert, {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "First parameter `postLatest` must be an object"
        );
    });
    test.throws(R.partial(methods.insert, {}, {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Second parameter `message` must be a string"
        );
    });
});

Tinytest.add("methods - insert - allow rules", function (test) {
    // BEFORE
    Meteor.userId = sinon.spy();
    var postLatest = {a: "a"};
    var instance = {};
    rulesEngine.setupRulesEngine(instance);
    rulesEngine.registerRules(instance, "allow", {
        insert: R.F
    });
    var insert = methods.insert.bind({}, instance, postLatest, "");
    // TEST
    test.throws(insert, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "No allow rule returned true, aborting"
        );
    });
    // AFTER
    Meteor.userId = null;
});

Tinytest.add("methods - insert - deny rules", function (test) {
    // BEFORE
    Meteor.userId = sinon.spy();
    var postLatest = {a: "a"};
    var instance = {};
    rulesEngine.setupRulesEngine(instance);
    rulesEngine.registerRules(instance, "allow", {
        insert: R.T
    });
    rulesEngine.registerRules(instance, "deny", {
        insert: R.T
    });
    var insert = methods.insert.bind({}, instance, postLatest, "");
    // TEST
    test.throws(insert, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Some deny rule(s) returned true, aborting"
        );
    });
    // AFTER
    Meteor.userId = null;
});

Tinytest.add("methods - insert - call insert", function (test) {
    // BEFORE
    Meteor.userId = sinon.spy();
    var postLatest = {a: "a"};
    var instance = {
        insert: sinon.spy()
    };
    rulesEngine.setupRulesEngine(instance);
    rulesEngine.registerRules(instance, "allow", {
        insert: R.T
    });
    rulesEngine.registerRules(instance, "deny", {
        insert: R.F
    });
    // TEST
    methods.insert.call({}, instance, postLatest, "");
    test.isTrue(instance.insert.called);
    // AFTER
    Meteor.userId = null;
});

/*
*   commit method
*/

Tinytest.add("methods - commit - argument type checking", function (test) {
    // TEST
    test.throws(R.partial(methods.commit, {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "First parameter `documentId` must be a string"
        );
    });
    test.throws(R.partial(methods.commit, {}, ""), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Second parameter `postLatest` must be an object"
        );
    });
    test.throws(R.partial(methods.commit, {}, "", {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Third parameter `message` must be a string"
        );
    });
});

Tinytest.add("methods - commit - error if documentId is phony", function (test) {
    // BEFORE
    Meteor.userId = sinon.spy();
    var postLatest = {a: "a"};
    var instance = {
        _collection: {
            findOne: R.always(undefined)
        }
    };
    var commit = methods.commit.bind({}, instance, "", postLatest, "");
    // TEST
    test.throws(commit, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Document not found"
        );
    });
    // AFTER
    Meteor.userId = null;
});

Tinytest.add("methods - commit - allow rules", function (test) {
    // BEFORE
    Meteor.userId = sinon.spy();
    var postLatest = {a: "a"};
    var instance = {
        _collection: {
            findOne: R.always({
                latest: {}
            })
        }
    };
    rulesEngine.setupRulesEngine(instance);
    rulesEngine.registerRules(instance, "allow", {
        commit: R.F
    });
    var commit = methods.commit.bind({}, instance, "", postLatest, "");
    // TEST
    test.throws(commit, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "No allow rule returned true, aborting"
        );
    });
    // AFTER
    Meteor.userId = null;
});

Tinytest.add("methods - commit - deny rules", function (test) {
    // BEFORE
    Meteor.userId = sinon.spy();
    var postLatest = {a: "a"};
    var instance = {
        _collection: {
            findOne: R.always({
                latest: {}
            })
        }
    };
    rulesEngine.setupRulesEngine(instance);
    rulesEngine.registerRules(instance, "allow", {
        commit: R.T
    });
    rulesEngine.registerRules(instance, "deny", {
        commit: R.T
    });
    var commit = methods.commit.bind({}, instance, "", postLatest, "");
    // TEST
    test.throws(commit, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Some deny rule(s) returned true, aborting"
        );
    });
    // AFTER
    Meteor.userId = null;
});

Tinytest.add("methods - commit - call commit", function (test) {
    // BEFORE
    Meteor.userId = sinon.spy();
    var postLatest = {a: "a"};
    var instance = {
        _collection: {
            findOne: R.always({
                latest: {}
            })
        },
        commit: sinon.spy()
    };
    rulesEngine.setupRulesEngine(instance);
    rulesEngine.registerRules(instance, "allow", {
        commit: R.T
    });
    rulesEngine.registerRules(instance, "deny", {
        commit: R.F
    });
    // TEST
    methods.commit.call({}, instance, "", postLatest, "");
    test.isTrue(instance.commit.called);
    // AFTER
    Meteor.userId = null;
});
