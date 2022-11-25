'use strict';

function deepMerge(target, ...sources) {
    for(let source of sources) {
        for(let key in source) {
            if (source == null) {
                continue;
            }
            target[key] = replaceValue(target[key], source[key]);
        }
    }
    return target;
}

function replaceValue(value, newValue) {
    if (Array.isArray(value) && Array.isArray(newValue)) {
        return newValue.map((element, i) => {
            return replaceValue(value[i], element);
        });
    } else if (isObject(value) && isObject(newValue)) {
        return deepMerge(value, newValue);
    }
    return newValue;
}

function isObject(obj) {
    return obj !== undefined && obj !== null && typeof obj === 'object' && !Array.isArray(obj);
}

module.exports = deepMerge;
