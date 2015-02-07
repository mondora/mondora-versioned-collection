var R     = Npm.require("ramda");
var sinon = Npm.require("sinon");

/*
*   setupRuleEngine
*/

Tinytest.add("ruleEngine - setupRuleEngine - setup", function (test) {
    var instance = {};
    // TEST
    ruleEngine.setupRuleEngine(instance);
    test.equal(instance, {
        _allowRules: {
            insert: [],
            commit: []
        },
        _denyRules: {
            insert: [],
            commit: []
        }
    });
});

/*
*   registerRules
*/

Tinytest.add("ruleEngine - registerRules - single registration", function (test) {
    var instance = {};
    ruleEngine.setupRuleEngine(instance);
    // TEST
    ruleEngine.registerRules(instance, "allow", {
        insert: "insert",
        commit: "commit"
    });
    test.equal(instance._allowRules.insert[0], "insert");
    test.equal(instance._allowRules.commit[0], "commit");
});

Tinytest.add("ruleEngine - registerRules - multiple registration", function (test) {
    var instance = {};
    ruleEngine.setupRuleEngine(instance);
    // TEST
    ruleEngine.registerRules(instance, "allow", {
        insert: "insert",
        commit: "commit"
    });
    ruleEngine.registerRules(instance, "allow", {
        insert: "insertAgain",
        commit: "commitAgain"
    });
    test.equal(instance._allowRules.insert[0], "insert");
    test.equal(instance._allowRules.commit[0], "commit");
    test.equal(instance._allowRules.insert[1], "insertAgain");
    test.equal(instance._allowRules.commit[1], "commitAgain");
});

/*
*   runRules
*/

Tinytest.add("ruleEngine - runRules - single rule", function (test) {
    var instance = {};
    ruleEngine.setupRuleEngine(instance);
    var insert = sinon.spy(R.T);
    var commit = sinon.spy(R.T);
    ruleEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    // TEST
    ruleEngine.runRules(instance, "allow", "insert", "userId", "preLatest", "postLatest");
    test.isTrue(insert.calledWith("userId", "postLatest"));
    test.equal(insert.callCount, 1);
    ruleEngine.runRules(instance, "allow", "commit", "userId", "preLatest", "postLatest");
    test.isTrue(commit.calledWith("userId", "preLatest", "postLatest"));
    test.equal(commit.callCount, 1);
});

Tinytest.add("ruleEngine - runRules - multiple rules", function (test) {
    var instance = {};
    ruleEngine.setupRuleEngine(instance);
    var insert = sinon.spy(R.T);
    var commit = sinon.spy(R.T);
    ruleEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    ruleEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    ruleEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    // TEST
    ruleEngine.runRules(instance, "allow", "insert", "userId", "preLatest", "postLatest");
    test.isTrue(insert.calledWith("userId", "postLatest"));
    test.equal(insert.callCount, 3);
    ruleEngine.runRules(instance, "allow", "commit", "userId", "preLatest", "postLatest");
    test.isTrue(commit.calledWith("userId", "preLatest", "postLatest"));
    test.equal(commit.callCount, 3);
});
