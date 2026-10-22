// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const prettierPlugin = require("eslint-plugin-prettier/recommended")

module.exports = defineConfig([
  expoConfig,
  prettierPlugin,
  {
    ignores: ["node_modules/**", ".expo/**", "dist/**", "web-build/**", "android/**", "ios/**", ".claude/**"]
  },
  {
    rules: {
      // Форматирование — через Prettier (см. .prettierrc)
      "prettier/prettier": "warn",

      // React
      "react/jsx-no-useless-fragment": ["warn", { allowExpressions: true }],
      "react/self-closing-comp": "warn",
      "react/no-array-index-key": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // Качество кода
      "no-unused-vars": [
        "warn",
        { args: "after-used", argsIgnorePattern: "^_", ignoreRestSiblings: true, varsIgnorePattern: "^_" }
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "no-var": "error",
      "prefer-const": "warn",
      eqeqeq: ["error", "smart"],
      "no-nested-ternary": "off",
      "object-shorthand": "warn",

      // Импорты
      "import/no-unresolved": "off",
      "import/order": [
        "warn",
        {
          groups: ["builtin", "external", "internal", ["parent", "sibling", "index"]],
          "newlines-between": "never",
          alphabetize: { order: "asc", caseInsensitive: true }
        }
      ]
    }
  }
])
