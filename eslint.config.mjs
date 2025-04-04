import globals from 'globals';
import pluginJs from '@eslint/js';

/** @type {import('eslint').Linter.Config[]} */
export default [
	{files: ['**/*.js'], languageOptions: {sourceType: 'commonjs'}},
	{languageOptions: {globals: globals.node}},
	pluginJs.configs.recommended,
	{
		rules: {
			'space-before-function-paren': ['error', 'always'],
			'comma-dangle': [
				'error',
				{
					'arrays': 'always-multiline',
					'objects': 'always-multiline',
					'imports': 'always-multiline',
					'exports': 'always-multiline',
					'functions': 'never',
				},
			],
			'indent': ['error', 'tab'],
			'array-bracket-newline': [
				'error',
				{
					'multiline': true,
					'minItems': 3,
				},
			],
			'array-element-newline': [
				'error',
				{
					'multiline': true,
					'minItems': 3,
				},
			],
			'object-curly-newline': [
				'error',
				{
					'ObjectExpression': {'multiline': true, 'minProperties': 3},
					'ObjectPattern': {'multiline': true, 'minProperties': 3},
					'ImportDeclaration': {'multiline': true, 'minProperties': 3},
					'ExportDeclaration': {'multiline': true, 'minProperties': 3},
				},
			],
			'semi': ['error', 'always'],
			'max-len': ['error', {'code': 150}],
			'quotes': [
				'error',
				'single',
				{'allowTemplateLiterals': true},
			],
		},
	},
];
