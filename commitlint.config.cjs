/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      1,
      'always',
      [
        'infra',
        'web',
        'ui',
        'config',
        'types',
        'validation',
        'database',
        'auth',
        'shared',
        'supabase',
        'ci',
        'docs',
        'deps',
        'release',
      ],
    ],
  },
};
