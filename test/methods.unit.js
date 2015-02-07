var R     = Npm.require("ramda");
var sinon = Npm.require("sinon");

/*
*   insert method
*/

Tinytest.add("insert method - argument type checking", function (test) {
    // TEST
    test.throws(R.lPartial(methods.insert, {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "First parameter `delta` must be an object"
        );
    });
    test.throws(R.lPartial(methods.insert, {}, {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Second parameter `message` must be a string"
        );
    });
});

Tinytest.add("insert method - allow rules", function (test) {
    var delta = {a: ["a"]};
    var instance = {
        _runAllowRules: R.F
    };
    var insert = methods.insert.bind({}, instance, delta, "");
    // TEST
    test.throws(insert, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "No allow rule returned true, aborting"
        );
    });
});

Tinytest.add("insert method - deny rules", function (test) {
    var delta = {a: ["a"]};
    var instance = {
        _runAllowRules: R.T,
        _runDenyRules: R.T
    };
    var insert = methods.insert.bind({}, instance, delta, "");
    // TEST
    test.throws(insert, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Some deny rule(s) returned true, aborting"
        );
    });
});

Tinytest.add("insert method - call insert", function (test) {
    var delta = {a: ["a"]};
    var instance = {
        _runAllowRules: R.T,
        _runDenyRules: R.F,
        insert: sinon.spy()
    };
    // TEST
    methods.insert.call({}, instance, delta, "");
    test.isTrue(instance.insert.called);
});

/*
*   commit method
*/

Tinytest.add("commit method - argument type checking", function (test) {
    // TEST
    test.throws(R.lPartial(methods.commit, {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "First parameter `documentId` must be a string"
        );
    });
    test.throws(R.lPartial(methods.commit, {}, ""), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Second parameter `delta` must be an object"
        );
    });
    test.throws(R.lPartial(methods.commit, {}, "", {}), function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Third parameter `message` must be a string"
        );
    });
});

Tinytest.add("commit method - allow rules", function (test) {
    var delta = {a: ["a"]};
    var instance = {
        _runAllowRules: R.F,
        _collection: {
            findOne: R.always({
                latest: {}
            })
        }
    };
    var commit = methods.commit.bind({}, instance, "", delta, "");
    // TEST
    test.throws(commit, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "No allow rule returned true, aborting"
        );
    });
});

Tinytest.add("commit method - deny rules", function (test) {
    var delta = {a: ["a"]};
    var instance = {
        _runAllowRules: R.T,
        _runDenyRules: R.T,
        _collection: {
            findOne: R.always({
                latest: {}
            })
        }
    };
    var commit = methods.commit.bind({}, instance, "", delta, "");
    // TEST
    test.throws(commit, function (e) {
        return (
            e.errorType === "Meteor.Error" &&
            e.reason === "Some deny rule(s) returned true, aborting"
        );
    });
});

Tinytest.add("commit method - call commit", function (test) {
    var delta = {a: ["a"]};
    var instance = {
        _runAllowRules: R.T,
        _runDenyRules: R.F,
        _collection: {
            findOne: R.always({
                latest: {}
            })
        },
        commit: sinon.spy()
    };
    // TEST
    methods.commit.call({}, instance, "", delta, "");
    test.isTrue(instance.commit.called);
});
