export function convertNestedJSONStringToObj(inputObj) {
    function replacer(value) {
        if (typeof value === 'string') {
            try {
                return JSON.parse(value);
            } catch (e) {
                return value;
            }
        }
        if (Array.isArray(value)) {
            return value.map(replacer);
        }
        if (typeof value === 'object' && value !== null) {
            return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, replacer(v)]));
        }
    }
    return JSON.parse(JSON.stringify(inputObj, (k, v) => replacer(v)));
}