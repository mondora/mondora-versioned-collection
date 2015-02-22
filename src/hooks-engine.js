var R = Npm.require("ramda");

var getPropertyName = function (type) {
    return "_" + type + "Hooks";
};

hooksEngine = {

    setupHooksEngine: function (instance) {
        var hooksStore = {
            insert: [],
            commit: []
        };
        instance[getPropertyName("before")] = R.clone(hooksStore);
        instance[getPropertyName("after")] = R.clone(hooksStore);
    },

    registerHooks: function (instance, type, hookSet) {
        R.keys(hookSet).forEach(function (key) {
            instance[getPropertyName(type)][key].push(hookSet[key]);
        });
    },

    /*
    *  Before hooks have the possibility to:
    *
    *   - abort the operation, by calling `this.abort`
    *
    *   - modify the `postLatest` object, by calling
    *     `this.replacePostLatest`, passing it the new `postLatest` object
    *
    *  Hooks are run in the same order they are registered.
    *
    *  If a hook aborts the operation, subsequent hooks won't be run.
    *
    *  If a hook replaces the `postLatest` object, subsequent hooks will receive
    *  the replaced in their `postLatest` argument. If they wish to get the
    *  original `postLatest` object, they can call `this.getOriginalPostLatest`.
    *
    */

    runBeforeHooks: function (instance, method, userId, preLatest, postLatest, message) {

        // Construct the result object
        var result = {
            aborted: false,
            postLatest: postLatest
        };

        // Construct the context on which the hook will run
        var context = {
            abort: function () {
                result.aborted = true;
            },
            replacePostLatest: function (replacement) {
                result.postLatest = replacement;
            },
            getOriginalPostLatest: function () {
                return R.clone(postLatest);
            }
        };

        // Run hooks
        R.forEach(function (action) {
            if (result.aborted) {
                return;
            }
            if (method === "insert") {
                action.call(
                    R.clone(context),
                    userId,
                    R.clone(result.postLatest),
                    message
                );
            }
            if (method === "commit") {
                action.call(
                    R.clone(context),
                    userId,
                    R.clone(preLatest),
                    R.clone(result.postLatest),
                    message
                );
            }
        }, instance[getPropertyName("before")][method]);

        // Return the result object
        return result;

    },

    /*
    *  After hooks are run in the same order they are registered.
    *
    *  When after hooks are run, the operation has already been carried out, so
    *  the hooks can't do anything to effect it.
    *
    */

    runAfterHooks: function (instance, method, userId, preLatest, postLatest, message) {

        // Run hooks
        R.forEach(function (action) {
            if (method === "insert") {
                action.call(
                    null,
                    userId,
                    R.clone(postLatest),
                    message
                );
            }
            if (method === "commit") {
                action.call(
                    null,
                    userId,
                    R.clone(preLatest),
                    R.clone(postLatest),
                    message
                );
            }
        }, instance[getPropertyName("after")][method]);

    }

};
