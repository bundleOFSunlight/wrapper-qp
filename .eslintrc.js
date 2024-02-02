module.exports = {
    env: {
        es2020: true,
        node: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 11,
        sourceType: 'module',
    },
    ignorePatterns: ['docs/'],
    rules: {
        'no-unused-vars': ['warn', { args: 'none', varsIgnorePattern: '^_', ignoreRestSiblings: true, caughtErrors: 'none'}],
        'no-useless-catch': [0, {}],
        'no-case-declarations': 'off',
        'no-prototype-builtins' : 'off',
        'no-empty': 'off',
        'no-cond-assign': 'off',
        'no-constant-condition': 'off',
        'no-async-promise-executor': 'off'
    },
};
