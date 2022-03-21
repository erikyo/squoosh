/**
 * Set WordPress presets
 */

const eslintConfig = {
  globals: {
    squoosh: true,
  },
  rules: {
    "padding-line-between-statements": [
      "error",
      {
        blankLine: "always",
        next: ["function", "const", "let", "var"],
        prev: "return",
      },
    ],
    "max-len": ["error", { code: 160, tabWidth: 12 }],
  },
};



eslintConfig.parserOptions = {
  ecmaVersion: 'latest',
  sourceType: 'module',
  env: { es6: true },
  babelOptions: {
    presets: [require.resolve("@babel/preset-typescript")],
  },
};

module.exports = eslintConfig;
