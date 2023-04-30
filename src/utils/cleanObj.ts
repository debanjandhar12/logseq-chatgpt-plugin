export function cleanObj(inputObj) {
    function isEmpty(value) {
        if (value === null || value === undefined) {
            return true;
        }

        if (Array.isArray(value)) {
            return value.every(isEmpty);
        } else if (typeof (value) === 'object') {
            return Object.values(value).every(isEmpty);
        }

        return false;
    }
    return JSON.parse(JSON.stringify(inputObj, (k, v) => isEmpty(v)
        ? undefined
        : v));
}
