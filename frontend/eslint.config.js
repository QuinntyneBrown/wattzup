// @ts-check
const eslint = require('@eslint/js');
const { defineConfig } = require('eslint/config');
const tseslint = require('typescript-eslint');
const angular = require('angular-eslint');

const outside = {
  regex: '^(\\.\\./){3,}',
  message: 'A library never imports outside its project.',
};
const noRide = { group: ['**/ride/**'], message: 'No library imports the app.' };

/** Only `domain/src/bluetooth/` may touch Web Bluetooth (AGENTS.md, L2-146 AC3). */
const noBluetooth = {
  'no-restricted-properties': [
    'error',
    {
      object: 'navigator',
      property: 'bluetooth',
      message: 'Only domain/src/bluetooth/ touches navigator.bluetooth.',
    },
  ],
};

/** Text from a rider, a bike or Bluetooth is data, never markup (L2-129 AC2): nothing turns Angular's sanitising off. */
const noBypass = {
  'no-restricted-syntax': [
    'error',
    {
      selector: 'CallExpression[callee.property.name=/^bypassSecurityTrust/]',
      message: "Never bypass Angular's sanitiser: render text with interpolation (L2-129 AC2).",
    },
  ],
};

module.exports = defineConfig([
  {
    files: ['**/*.ts'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      '@angular-eslint/directive-selector': [
        'error',
        { type: 'attribute', prefix: 'wz', style: 'camelCase' },
      ],
      '@angular-eslint/component-selector': [
        'error',
        // Elements, and attribute components on a native element as Angular Material writes them (a[wz-button]).
        { type: ['element', 'attribute'], prefix: 'wz', style: 'kebab-case' },
      ],
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/prefer-standalone': 'error',
      '@angular-eslint/component-max-inline-declarations': ['error', { template: 0, styles: 0 }],
      '@angular-eslint/use-component-view-encapsulation': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      ...noBluetooth,
      ...noBypass,
    },
  },
  // Dependency direction (AGENTS.md, L2-146 AC2): ride -> components, api, domain, video, world; domain -> api;
  // components -> api for types only; video -> api; world -> api; api -> nothing in the workspace.
  {
    files: ['projects/api/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@telo/api', message: 'Import within the library by relative path.' },
            {
              name: '@telo/domain',
              message: 'The api library depends on nothing in the workspace.',
            },
            {
              name: '@telo/components',
              message: 'The api library depends on nothing in the workspace.',
            },
            {
              name: '@telo/video',
              message: 'The api library depends on nothing in the workspace.',
            },
            {
              name: '@telo/world',
              message: 'The api library depends on nothing in the workspace.',
            },
            { name: '@angular/router', message: 'The api library knows no route.' },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/domain/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@telo/domain', message: 'Import within the library by relative path.' },
            { name: '@telo/components', message: 'The domain library depends on api only.' },
            { name: '@telo/video', message: 'The domain library depends on api only.' },
            { name: '@telo/world', message: 'The domain library depends on api only.' },
            { name: '@angular/router', message: 'The domain library knows no route.' },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/domain/src/bluetooth/**/*.ts'],
    rules: { 'no-restricted-properties': 'off' },
  },
  {
    files: ['projects/components/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@telo/api',
              allowTypeImports: true,
              message: 'Presentation components name api types only.',
            },
            { name: '@telo/domain', message: 'Presentation components inject no service.' },
            { name: '@telo/components', message: 'Import a sibling component by relative path.' },
            { name: '@telo/video', message: 'Presentation components inject no service.' },
            { name: '@telo/world', message: 'Presentation components inject no service.' },
            {
              name: '@angular/router',
              message: 'Presentation components know no route; emit an output.',
            },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/video/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@telo/video', message: 'Import within the library by relative path.' },
            { name: '@telo/domain', message: 'The video library depends on api only.' },
            { name: '@telo/components', message: 'The video library depends on api only.' },
            { name: '@telo/world', message: 'The video library depends on api only.' },
            { name: '@angular/router', message: 'The video library knows no route.' },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/world/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@telo/world', message: 'Import within the library by relative path.' },
            { name: '@telo/domain', message: 'The world library depends on api only.' },
            { name: '@telo/components', message: 'The world library depends on api only.' },
            { name: '@telo/video', message: 'The world library depends on api only.' },
            { name: '@angular/router', message: 'The world library knows no route.' },
          ],
          patterns: [outside, noRide],
        },
      ],
    },
  },
  {
    files: ['projects/ride/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              regex: '^(\\.\\./){4,}',
              message:
                'Use @telo/api, @telo/domain, @telo/components, @telo/video or @telo/world, never a library path.',
            },
          ],
        },
      ],
    },
  },
  // The marketing site (ADR 0027): components and api only; it never talks to the bike.
  {
    files: ['projects/marketing/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          paths: [
            { name: '@telo/domain', message: 'The marketing site never talks to the bike.' },
            { name: '@telo/video', message: 'The marketing site plays its film with wz-film.' },
            { name: '@telo/world', message: 'The marketing site draws no world.' },
            { name: '@angular/router', message: 'The marketing site is one page with no router.' },
          ],
          patterns: [
            {
              regex: '^(\\.\\./){3,}',
              message: 'Use @telo/components or @telo/api, never a library path.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.html'],
    extends: [angular.configs.templateRecommended, angular.configs.templateAccessibility],
    rules: {
      '@angular-eslint/template/no-inline-styles': 'error',
      // Untrusted text is rendered as text (L2-129 AC2): a template never binds markup.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'BoundAttribute[name=/^(innerHTML|outerHTML)$/]',
          message: 'Bind text with interpolation, never [innerHTML] or [outerHTML] (L2-129 AC2).',
        },
      ],
    },
  },
]);
