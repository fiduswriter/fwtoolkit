import eslint from "@eslint/js"
import tseslint from "typescript-eslint"

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["src/**/*.ts", "test/**/*.ts"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module"
        },
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }
            ],
            semi: "off",
            "@typescript-eslint/semi": "off"
        }
    },
    {
        files: ["scripts/**/*.js"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                console: "readonly",
                URL: "readonly"
            }
        }
    },
    {
        files: ["demo/demo-worker.js"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                self: "readonly"
            }
        }
    },
    {
        ignores: ["dist/", "node_modules/", ".pages-build/"]
    }
)
