/** @type {import('jest').Config} */
export default {
    testEnvironment: "jsdom",
    extensionsToTreatAsEsm: [".ts"],
    setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
    transform: {
        "^.+\\.ts$": [
            "@swc/jest",
            {
                jsc: {
                    parser: {
                        syntax: "typescript"
                    },
                    target: "es2020"
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
