export function cleanObj(inputObj) {
    function isEmpty(value) {
        if (value === null || value === undefined || value === false
            || (typeof value === 'string' && value.trim() === '')
            || (typeof value === 'string' && value.startsWith('data:image/png;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/jpeg;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/jpg;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/gif;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/webp;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/svg+xml;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/bmp;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/tiff;base64,'))
            || (typeof value === 'string' && value.startsWith('data:image/x-icon;base64,'))
            || (typeof value === 'string' && value.startsWith('base64,'))
            || (typeof value === 'number' && isNaN(value))
            || (typeof value === 'object' && Object.keys(value).length === 0)
            || (typeof value === 'function' && value.toString().trim() === '() => {}')
            || (typeof value === 'function' && value.toString().trim() === 'function () {}')) {
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
