module.exports = {
    testEnvironment: 'jest-environment-jsdom',
    testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.tsx?$',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    // Optional: configure Babel options
    transformIgnorePatterns: [
        '/node_modules/',
    ],
    preset: 'ts-jest',
};