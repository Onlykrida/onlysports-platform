// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'supabase/functions/**'],
    rules: {
      // React Native renders <Text>You're great</Text> literally; HTML entity
      // escapes (`&apos;`) would render visibly. This rule is a web-first
      // false positive in an RN codebase, so turn it off project-wide.
      'react/no-unescaped-entities': 'off',
    },
  },
]);
