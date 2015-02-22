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
    rulesEngine.setupRulesEngine(this);
    hooksEngine.setupHooksEngine(this);
};

VersionedCollection.prototype = {

    _registerMethods: function () {
        var self = this;
        var insertMethodName = "VersionedCollection:" + self._name + ":insert";
        var commitMethodName = "VersionedCollection:" + self._name + ":commit";
        var meteorMethods = {};
        meteorMethods[insertMethodName] = function (postLatest, message) {
            methods.insert.call(this, self, postLatest, message);
        };
        meteorMethods[commitMethodName] = function (documentId, postLatest, message) {
            methods.commit.call(this, self, documentId, postLatest, message);
        };
        Meteor.methods(meteorMethods);
    },

    /*
    *   Allow API
    */

    allow: function (ruleSet) {
        rulesEngine.registerRules(this, "allow", ruleSet);
    },

    deny: function (ruleSet) {
        rulesEngine.registerRules(this, "deny", ruleSet);
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
        // Ensure postLatest matches the schema
        utils.ensure(
            Match.test(postLatest, this._schema),
            "Latest after commit doesn't match schema, aborting"
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
        // Ensure it matches the schema
        utils.ensure(
            Match.test(postLatest, this._schema),
            "Latest after commit doesn't match schema, aborting"
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

    find: function (/* selector, options */) {
        return this._collection.find.apply(this._collection, arguments);
    },

    findOne: function (/* selector, options */) {
        return this._collection.findOne.apply(this._collection, arguments);
    }

};
