var getPropertyName = function (type) {
    return "_" + type + "Rules";
};

var registerRules = function (instance, type, ruleSet) {
    R.keys(ruleSet).forEach(function (key) {
        instance[getPropertyName(type)][key].push(ruleSet[key]);
    });
};

var runRules = function (instance, type, method, userId, preLatest, postLatest) {
    return instance[getPropertyName(type)][method].map(function (rule) {
        if (method === "insert") {
            return rule(userId, postLatest);
        }
        if (method === "commit") {
            return rule(userId, preLatest, postLatest);
        }
    });
};

ruleEngine = {
    registerRules: registerRules,
    runRules: runRules
};
