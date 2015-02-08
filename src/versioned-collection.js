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
};

VersionedCollection.prototype = {

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

    allow: function (ruleSet) {
        ruleEngine.registerRules(this, "allow", ruleSet);
    },

    deny: function (ruleSet) {
        ruleEngine.registerRules(this, "deny", ruleSet);
    },

    insert: function (userId, postLatest, message) {
        // Construct the delta object
        var delta = jdp.diff({}, postLatest);
        // Ensure postLatest matches the schema
        utils.ensure(
            Match.test(postLatest, this._schema),
            "Latest after commit doesn't match schema, aborting"
        );
        // Perform the insert
        var now = Date.now();
        return this._collection.insert({
            commits: [{
                userId: userId,
                date: now,
                delta: delta,
                message: message
            }],
            latest: postLatest,
            lastModifiedOn: now,
            lastModifiedBy: userId
        });
    },

    commit: function (userId, documentId, delta, message) {
        // Construct the post latest object
        var doc = this._collection.findOne({_id: documentId});
        var postLatest = jdp.patch(R.clone(doc.latest), delta);
        // Ensure it matches the schema
        utils.ensure(
            Match.test(postLatest, this._schema),
            "Latest after commit doesn't match schema, aborting"
        );
        // Perform the update
        var now = Date.now();
        return this._collection.update({_id: documentId}, {
            $addToSet: {
                commits: {
                    userId: userId,
                    date: now,
                    delta: delta,
                    message: message
                }
            },
            $set: {
                latest: postLatest,
                lastModifiedBy: userId,
                lastModifiedOn: now
            }
        });
    },

    find: function (selector, options) {
        return this._collection.find(selector, options);
    },

    findOne: function (selector, options) {
        return this._collection.findOne(selector, options);
    }

};
