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

var VersionedCollection = function (name, latestSchema) {
    this._collection = new Mongo.Collection(name);
    this._schema = latestSchema || Match.Any;
    this._registerMethods();
    ruleEngine.setupRuleEngine(this);
};

VersionedCollection.prototype = {

    allow: function (ruleSet) {
        ruleEngine.registerRules(this, "allow", ruleSet);
    },

    deny: function (ruleSet) {
        ruleEngine.registerRules(this, "deny", ruleSet);
    },

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
        return R.any(result, R.identity);
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
        return R.any(result, R.identity);
    },

    insert: function (userId, delta, message) {
        // Construct the post latest objects
        var postLatest = jdp.patch({}, delta);
        // Check it matches the schema
        check(postLatest, this._schema);
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
        // Construct the post latest objects
        var doc = this._collection.findOne({_id: documentId});
        var postLatest = jdp.patch(R.clone(doc.latest), delta);
        // Check it matches the schema
        check(postLatest, this._schema);
        // Perform the update
        var now = Date.now();
        this._collection.update({_id: documentId}, {
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

    _registerMethods: function () {
        var self = this;
        var insertMethodName = "VersionedCollection:" + name + ":insert";
        var commitMethodName = "VersionedCollection:" + name + ":commit";
        var meteorMethods = {};
        meteorMethods[insertMethodName] = function (delta, message) {
            methods.insert(self, delta, message);
        };
        meteorMethods[commitMethodName] = function (documentId, delta, message) {
            methods.commit(self, documentId, delta, message);
        };
        Meteor.methods(meteorMethods);
    }

};
