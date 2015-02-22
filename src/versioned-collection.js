var jdp = Npm.require("jsondiffpatch");
var R   = Npm.require("ramda");

/*
*   Internally, the collection keeps the following data structure for a
*   versioned document.
*
*   NOTE: the structure is not enforced in any way (e.g. the SimpleSchema
*   library) other than the code convention.
*
*   Commit structure:
*
*   {
*       date: Number,
*       userId: String,
*       message: String,
*       delta: Object
*   }
*
*   Document structure:
*
*   {
*       commits: [commitStructure],
*       lastModifiedOn: Number,
*       lastModifiedBy: String,
*       latest: Object
*   }
*
*/

VersionedCollection = function (name, schema) {
    this._name = name;
    this._collection = new Mongo.Collection(name);
    this._schema = schema || Match.Any;
    this._registerMethods();
    ruleEngine.setupRuleEngine(this);
    hooksEngine.setupHooksEngine(this);
};

VersionedCollection.prototype = {

    /*
    *   TODO remove this two methods and call the ruleEngine directly from
    *   the methods, as we do for the hooksEngine
    */

    _runAllowRules: function (method, userId, preLatest, postLatest) {
        var result = ruleEngine.runRules(
            this,
            "allow",
            method,
            userId,
            preLatest,
            postLatest
        );
        // Return true if any of the allow calls returns true
        return R.any(R.identity, result);
    },

    _runDenyRules: function (method, userId, preLatest, postLatest) {
        var result = ruleEngine.runRules(
            this,
            "deny",
            method,
            userId,
            preLatest,
            postLatest
        );
        // Return true if any of the deny calls returns true
        return R.any(R.identity, result);
    },

    _registerMethods: function () {
        var self = this;
        var insertMethodName = "VersionedCollection:" + this._name + ":insert";
        var commitMethodName = "VersionedCollection:" + this._name + ":commit";
        var meteorMethods = {};
        meteorMethods[insertMethodName] = function (delta, message) {
            methods.insert(self, delta, message);
        };
        meteorMethods[commitMethodName] = function (documentId, delta, message) {
            methods.commit(self, documentId, delta, message);
        };
        Meteor.methods(meteorMethods);
    },

    /*
    *   Allow API
    */

    allow: function (ruleSet) {
        ruleEngine.registerRules(this, "allow", ruleSet);
    },

    deny: function (ruleSet) {
        ruleEngine.registerRules(this, "deny", ruleSet);
    },

    /*
    *   Hooks API
    */

    before: function (hookSet) {
        hooksEngine.registerHooks(this, "before", hookSet);
    },

    after: function (hookSet) {
        hooksEngine.registerHooks(this, "after", hookSet);
    },

    /*
    *   Operations API
    */

    insert: function (userId, postLatest, message) {
        // Ensure postLatest matches the schema
        utils.ensure(
            Match.test(postLatest, this._schema),
            "Latest after commit doesn't match schema, aborting"
        );
        // Run before hooks
        var beforeResult = hooksEngine.runBeforeHooks(
            this,
            "insert",
            userId,
            null,
            R.clone(postLatest),
            message
        );
        // Check the hooks didn't abort the operation
        utils.ensure(
            R.eq(false, beforeResult.aborted),
            "Some before hook aborted the operation"
        );
        // Construct the delta object
        var delta = jdp.diff({}, beforeResult.postLatest);
        // Perform the insert
        var now = Date.now();
        var ret = this._collection.insert({
            commits: [{
                userId: userId,
                date: now,
                delta: delta,
                message: message
            }],
            latest: beforeResult.postLatest,
            lastModifiedOn: now,
            lastModifiedBy: userId
        });
        // Run after hooks
        hooksEngine.runAfterHooks(
            this,
            "insert",
            userId,
            null,
            R.clone(beforeResult.postLatest),
            message
        );
        // Return the value returned by the Mongo.Collection.insert call, to
        // keep its same return signature
        return ret;
    },

    commit: function (userId, documentId, postLatest, message) {
        // Construct the post latest object
        var doc = this._collection.findOne({_id: documentId});
        // Ensure it matches the schema
        utils.ensure(
            Match.test(postLatest, this._schema),
            "Latest after commit doesn't match schema, aborting"
        );
        // Run before hooks
        var beforeResult = hooksEngine.runBeforeHooks(
            this,
            "commit",
            userId,
            R.clone(doc.latest),
            R.clone(postLatest),
            message
        );
        // Check the hooks didn't abort the operation
        utils.ensure(
            R.eq(false, beforeResult.aborted),
            "Some before hook aborted the operation"
        );
        // Construct the delta object
        var delta = jdp.diff(doc.latest, beforeResult.postLatest);
        // Perform the update
        var now = Date.now();
        var ret = this._collection.update({_id: documentId}, {
            $addToSet: {
                commits: {
                    userId: userId,
                    date: now,
                    delta: delta,
                    message: message
                }
            },
            $set: {
                latest: beforeResult.postLatest,
                lastModifiedBy: userId,
                lastModifiedOn: now
            }
        });
        // Run after hooks
        hooksEngine.runAfterHooks(
            this,
            "commit",
            userId,
            R.clone(doc.latest),
            R.clone(beforeResult.postLatest),
            message
        );
        // Return the value returned by the Mongo.Collection.update call, to
        // keep its same return signature
        return ret;
    },

    /*
    *   Query API
    */

    find: function (selector, options) {
        return this._collection.find(selector, options);
    },

    findOne: function (selector, options) {
        return this._collection.findOne(selector, options);
    }

};
