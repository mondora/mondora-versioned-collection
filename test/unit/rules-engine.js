var R     = Npm.require("ramda");
var sinon = Npm.require("sinon");

/*
*   setupRulesEngine
*/

Tinytest.add("rulesEngine - setupRulesEngine - setup", function (test) {
    // BEFORE
    var instance = {};
    // TEST
    rulesEngine.setupRulesEngine(instance);
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

Tinytest.add("rulesEngine - registerRules - single registration", function (test) {
    // BEFORE
    var instance = {};
    rulesEngine.setupRulesEngine(instance);
    // TEST
    rulesEngine.registerRules(instance, "allow", {
        insert: "insert",
        commit: "commit"
    });
    test.equal(instance._allowRules.insert[0], "insert");
    test.equal(instance._allowRules.commit[0], "commit");
});

Tinytest.add("rulesEngine - registerRules - multiple registration", function (test) {
    // BEFORE
    var instance = {};
    rulesEngine.setupRulesEngine(instance);
    // TEST
    rulesEngine.registerRules(instance, "allow", {
        insert: "insert",
        commit: "commit"
    });
    rulesEngine.registerRules(instance, "allow", {
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

Tinytest.add("rulesEngine - runRules - single rule", function (test) {
    // BEFORE
    var instance = {};
    rulesEngine.setupRulesEngine(instance);
    var insert = sinon.spy(R.T);
    var commit = sinon.spy(R.T);
    rulesEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    // TEST
    rulesEngine.runRules(instance, "allow", "insert", "userId", "preLatest", "postLatest");
    test.isTrue(insert.calledWith("userId", "postLatest"));
    test.equal(insert.callCount, 1);
    rulesEngine.runRules(instance, "allow", "commit", "userId", "preLatest", "postLatest");
    test.isTrue(commit.calledWith("userId", "preLatest", "postLatest"));
    test.equal(commit.callCount, 1);
});

Tinytest.add("rulesEngine - runRules - multiple rules", function (test) {
    // BEFORE
    var instance = {};
    rulesEngine.setupRulesEngine(instance);
    var insert = sinon.spy(R.T);
    var commit = sinon.spy(R.T);
    rulesEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    rulesEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    rulesEngine.registerRules(instance, "allow", {
        insert: insert,
        commit: commit
    });
    // TEST
    rulesEngine.runRules(instance, "allow", "insert", "userId", "preLatest", "postLatest");
    test.isTrue(insert.calledWith("userId", "postLatest"));
    test.equal(insert.callCount, 3);
    rulesEngine.runRules(instance, "allow", "commit", "userId", "preLatest", "postLatest");
    test.isTrue(commit.calledWith("userId", "preLatest", "postLatest"));
    test.equal(commit.callCount, 3);
});
