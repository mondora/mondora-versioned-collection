var R = Npm.require("ramda");

var getPropertyName = function (type) {
    return "_" + type + "Rules";
};

rulesEngine = {

    setupRulesEngine: function (instance) {
        var rulesStore = {
            insert: [],
            commit: []
        };
        instance[getPropertyName("allow")] = R.clone(rulesStore);
        instance[getPropertyName("deny")] = R.clone(rulesStore);
    },

    registerRules: function (instance, type, ruleSet) {
        R.keys(ruleSet).forEach(function (key) {
            instance[getPropertyName(type)][key].push(ruleSet[key]);
        });
    },

    runRules: function (instance, type, method, userId, preLatest, postLatest, message) {
        return instance[getPropertyName(type)][method].map(function (rule) {
            if (method === "insert") {
                return rule(userId, postLatest, message);
            }
            if (method === "commit") {
                return rule(userId, preLatest, postLatest, message);
            }
        });
    }

};
