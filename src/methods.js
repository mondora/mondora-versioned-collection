methods = {

    insert: function (instance, delta, message) {
        // Type-checking arguments
        check(delta, Object);
        check(message, String);
        // Construct the post latest objects
        var postLatest = jdp.patch({}, delta);
        // Run allow rules
        var allowed = instance._runAllowRules(
            "insert",
            this.userId,
            null,
            R.clone(postLatest)
        );
        assert(allowed, true);
        // Run deny rules
        var denied = instance._runDenyRules(
            "insert",
            this.userId,
            null,
            R.clone(postLatest)
        );
        assert(denied, false);
        // Perform the insert
        return instance.insert(this.userId, delta, message);
    },

    commit: function (instance, documentId, delta, message) {
        // Type-checking arguments
        check(documentId, String);
        check(delta, Object);
        check(message, String);
        // Construct the pre and post latest objects
        var doc = instance._collection.findOne({_id: documentId});
        var preLatest = R.clone(doc.latest);
        var postLatest = jdp.patch(R.clone(preLatest), delta);
        // Run allow rules
        var allowed = instance._runAllowRules(
            "commit",
            this.userId,
            R.clone(preLatest),
            R.clone(postLatest)
        );
        assert(allowed, true);
        // Run deny rules
        var denied = instance._runDenyRules(
            "commit",
            this.userId,
            R.clone(preLatest),
            R.clone(postLatest)
        );
        assert(denied, false);
        // Perform the commit
        return instance.commit(this.userId, documentId, delta, message);
    }

};
