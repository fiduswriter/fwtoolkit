/** @type {import('jest').Config} */
export default {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "jsdom",
    extensionsToTreatAsEsm: [".ts"],
    setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
    transform: {
        "^.+\\.ts$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: {
                    module: "NodeNext",
                    moduleResolution: "NodeNext",
                    isolatedModules: true
                }
            }
        ]
    },
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1"
    },
    testMatch: ["<rootDir>/test/**/*.test.ts"],
    collectCoverageFrom: ["<rootDir>/src/**/*.ts"]
}
