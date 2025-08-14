"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAMING_STYLES = exports.NAMING_TYPES = void 0;
exports.isNamingType = isNamingType;
exports.isNamingStyle = isNamingStyle;
exports.isValidDescription = isValidDescription;
exports.NAMING_TYPES = ['function', 'variable', 'class', 'boolean', 'constant'];
exports.NAMING_STYLES = ['camelCase', 'snake_case', 'PascalCase', 'kebab-case', 'UPPER_SNAKE_CASE'];
function isNamingType(value) {
    return exports.NAMING_TYPES.includes(value);
}
function isNamingStyle(value) {
    return exports.NAMING_STYLES.includes(value);
}
function isValidDescription(value) {
    return typeof value === 'string' &&
        value.trim().length > 0 &&
        value.length <= 500;
}
//# sourceMappingURL=api.js.map