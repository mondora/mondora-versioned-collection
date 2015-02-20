var R     = Npm.require("ramda");
var sinon = Npm.require("sinon");

/*
*   setupHooksEngine
*/

Tinytest.add("hooksEngine - setupHooksEngine - setup", function (test) {
    // BEFORE
    var instance = {};
    // TEST
    hooksEngine.setupHooksEngine(instance);
    test.equal(instance, {
        _beforeHooks: {
            insert: [],
            commit: []
        },
        _afterHooks: {
            insert: [],
            commit: []
        }
    });
});

/*
*   registerHooks
*/

Tinytest.add("hooksEngine - registerHooks - single registration", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    // TEST
    hooksEngine.registerHooks(instance, "before", {
        insert: "insert",
        commit: "commit"
    });
    test.equal(instance._beforeHooks.insert[0], "insert");
    test.equal(instance._beforeHooks.commit[0], "commit");
});

Tinytest.add("hooksEngine - registerHooks - multiple registration", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    // TEST
    hooksEngine.registerHooks(instance, "before", {
        insert: "insert",
        commit: "commit"
    });
    hooksEngine.registerHooks(instance, "before", {
        insert: "insertAgain",
        commit: "commitAgain"
    });
    test.equal(instance._beforeHooks.insert[0], "insert");
    test.equal(instance._beforeHooks.commit[0], "commit");
    test.equal(instance._beforeHooks.insert[1], "insertAgain");
    test.equal(instance._beforeHooks.commit[1], "commitAgain");
});

/*
*   runBeforeHooks
*/

Tinytest.add("hooksEngine - runBeforeHooks - single hook", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    var insert = sinon.spy();
    var commit = sinon.spy();
    hooksEngine.registerHooks(instance, "before", {
        insert: insert,
        commit: commit
    });
    // TEST
    hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", "postLatest");
    test.isTrue(insert.calledWith("userId", "postLatest"));
    test.equal(insert.callCount, 1);
    hooksEngine.runBeforeHooks(instance, "commit", "userId", "preLatest", "postLatest");
    test.isTrue(commit.calledWith("userId", "preLatest", "postLatest"));
    test.equal(commit.callCount, 1);
});

Tinytest.add("hooksEngine - runBeforeHooks - multiple hooks", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    var insert = sinon.spy();
    var commit = sinon.spy();
    hooksEngine.registerHooks(instance, "before", {
        insert: insert,
        commit: commit
    });
    hooksEngine.registerHooks(instance, "before", {
        insert: insert,
        commit: commit
    });
    hooksEngine.registerHooks(instance, "before", {
        insert: insert,
        commit: commit
    });
    // TEST
    hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", "postLatest");
    test.isTrue(insert.calledWith("userId", "postLatest"));
    test.equal(insert.callCount, 3);
    hooksEngine.runBeforeHooks(instance, "commit", "userId", "preLatest", "postLatest");
    test.isTrue(commit.calledWith("userId", "preLatest", "postLatest"));
    test.equal(commit.callCount, 3);
});

Tinytest.add("hooksEngine - runBeforeHooks - context has an abort function", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    var abort;
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            abort = this.abort;
        }
    });
    // TEST
    hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", "postLatest");
    test.instanceOf(abort, Function);
});

Tinytest.add("hooksEngine - runBeforeHooks - context has a replacePostLatest function", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    var replacePostLatest;
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            replacePostLatest = this.replacePostLatest;
        }
    });
    // TEST
    hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", "postLatest");
    test.instanceOf(replacePostLatest, Function);
});

Tinytest.add("hooksEngine - runBeforeHooks - context has a getOriginalPostLatest function", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    var getOriginalPostLatest;
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            getOriginalPostLatest = this.getOriginalPostLatest;
        }
    });
    // TEST
    hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", "postLatest");
    test.instanceOf(getOriginalPostLatest, Function);
});

Tinytest.add("hooksEngine - runBeforeHooks - abort sets the aborted property", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            this.abort();
        }
    });
    // TEST
    var result = hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", "postLatest");
    test.isTrue(result.aborted);
});

Tinytest.add("hooksEngine - runBeforeHooks - abort prevents subsequent hooks to run", function (test) {
    // BEFORE
    var instance = {};
    hooksEngine.setupHooksEngine(instance);
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            this.abort();
        }
    });
    var secondInsert = sinon.spy();
    hooksEngine.registerHooks(instance, "before", {
        insert: secondInsert
    });
    // TEST
    hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", "postLatest");
    test.isFalse(secondInsert.called);
});

Tinytest.add("hooksEngine - runBeforeHooks - replacePostLatest changes the postLatest for subsequent hooks", function (test) {
    // BEFORE
    var instance = {};
    var originalPostLatest = {
        a: "a"
    };
    var replacedPostLatest = {
        b: "b"
    };
    hooksEngine.setupHooksEngine(instance);
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            this.replacePostLatest(replacedPostLatest);
        }
    });
    var secondInsert = sinon.spy();
    hooksEngine.registerHooks(instance, "before", {
        insert: secondInsert
    });
    // TEST
    var result = hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", originalPostLatest);
    test.equal(result.postLatest, replacedPostLatest);
    test.equal(secondInsert.firstCall.args[1], replacedPostLatest);
});

Tinytest.add("hooksEngine - runBeforeHooks - getOriginalPostLatest gets the original postLatest", function (test) {
    // BEFORE
    var instance = {};
    var originalPostLatest = {
        a: "a"
    };
    var replacedPostLatest = {
        b: "b"
    };
    var gottenOriginalPostLatest;
    hooksEngine.setupHooksEngine(instance);
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            this.replacePostLatest(replacedPostLatest);
        }
    });
    hooksEngine.registerHooks(instance, "before", {
        insert: function () {
            gottenOriginalPostLatest = this.getOriginalPostLatest();
        }
    });
    // TEST
    hooksEngine.runBeforeHooks(instance, "insert", "userId", "preLatest", originalPostLatest);
    test.equal(gottenOriginalPostLatest, originalPostLatest);
});
