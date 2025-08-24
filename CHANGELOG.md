# [1.9.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.8.0...v1.9.0) (2025-08-24)

### Features

- **security:** configure middleware, add security headers ([888a5b4](https://github.com/wmitrus/nextjs-15-boilerplate/commit/888a5b428dd0661a2688999e57f38670ac4cea65))

# [1.8.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.7.1...v1.8.0) (2025-08-24)

### Features

- **ResponseService:** implement generic response service for standarized api responses ([c13c55f](https://github.com/wmitrus/nextjs-15-boilerplate/commit/c13c55f7cf2f7cc955c3e70a24c9be3c18c9ab60))

## [1.7.1](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.7.0...v1.7.1) (2025-08-23)

### Bug Fixes

- **depcheck:** add @mdx-js/react and markdown-to-jsx to ignores ([0bb672e](https://github.com/wmitrus/nextjs-15-boilerplate/commit/0bb672ef3abf08dfde39eb46aa961dcc668870c8))

# [1.7.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.6.0...v1.7.0) (2025-08-23)

### Features

- add Renovate configuration for automated dependency management ([109a41e](https://github.com/wmitrus/nextjs-15-boilerplate/commit/109a41e69c45d767d5873b8131fd0d1a520d4727))
- **dependabot:** add configuration for automated dependency updates and auto-merging PRs ([5344c16](https://github.com/wmitrus/nextjs-15-boilerplate/commit/5344c168da573fa454e8f43bd12f5e7f30f5d7ff))

# [1.6.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.5.0...v1.6.0) (2025-08-23)

### Bug Fixes

- **env:** remove CODECOV_TOKEN from environment variables ([a95a452](https://github.com/wmitrus/nextjs-15-boilerplate/commit/a95a452d2c13b01174ff217e6231f8077fd70fd2))

### Features

- **env:** add CODECOV_TOKEN to environment configuration and tests ([4516954](https://github.com/wmitrus/nextjs-15-boilerplate/commit/4516954abc3f4238ee752cd90fd8c33ded7ddb56))

# [1.5.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.4.0...v1.5.0) (2025-08-22)

### Bug Fixes

- **Configure.mdx:** standardize import formatting for consistency ([eac3bcc](https://github.com/wmitrus/nextjs-15-boilerplate/commit/eac3bcc4a529d6d45ad3d844be6093d2b3d62372))
- **env:** update logLevels definition to use levels.labels from pino ([3c4ded5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3c4ded5449d0c400bb59d04613cdc01476252274))
- **eslint:** add testing-library rules for story files ([8e4ef50](https://github.com/wmitrus/nextjs-15-boilerplate/commit/8e4ef50b4831bf94d69c914efe2919e47dae67fc))
- **eslint:** disable 'testing-library/no-node-access' rule for Playwright tests ([98d4b52](https://github.com/wmitrus/nextjs-15-boilerplate/commit/98d4b527a6764eae9ee7ea509bb2e52c2e391065))
- **eslint:** disable storybook/no-renderer-packages rule ([f8ddeac](https://github.com/wmitrus/nextjs-15-boilerplate/commit/f8ddeac0ba48f19429c882d2734ea8001e856a46))
- **logger/utils:** update createConsoleStream return type to PrettyStream ([19ae9ab](https://github.com/wmitrus/nextjs-15-boilerplate/commit/19ae9ab978e3473848aab965f7fba9d512ce3d86))
- **logger:** correct import order for pino module ([ffe30fc](https://github.com/wmitrus/nextjs-15-boilerplate/commit/ffe30fcfdf397744ce8a21374a5c143e5e116d3f))
- **mocks:** add options to server and worker start methods for unhandled requests ([b639a45](https://github.com/wmitrus/nextjs-15-boilerplate/commit/b639a45dd9c9704ef1bee8e51f729dccaaab7733))
- **mocks:** enhance unhandled request handling for server and worker based on environment ([1d4eaa2](https://github.com/wmitrus/nextjs-15-boilerplate/commit/1d4eaa229dfe2696326665800ca69ff0583878a7))
- **mockServiceWorker:** update version, checksum; refactor event listeners ([5eac4fc](https://github.com/wmitrus/nextjs-15-boilerplate/commit/5eac4fcdc13f25e07f92affd54806a93dd477109))
- **mocks:** simplify initMocks by removing environment checks for unhandled requests ([cf004ee](https://github.com/wmitrus/nextjs-15-boilerplate/commit/cf004ee3f8b1a5a814ca56dc25ea99d184439398))
- **playwright:** add caching for Playwright browsers to improve test performance ([79a6409](https://github.com/wmitrus/nextjs-15-boilerplate/commit/79a640987fe6919121077714599d1ba74d3ca8ae))
- **playwright:** add environment variables for Playwright tests ([f4628e5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/f4628e5d3e90e1d884ed92583e6ea54e8a501bdc))
- **playwright:** move headless option inside use configuration ([3b773a2](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3b773a25268fb9eb6afdba120cf20c065918c7f3))

### Features

- **docs:** add repository information overview and structure details ([267737a](https://github.com/wmitrus/nextjs-15-boilerplate/commit/267737a7f8b3a5a07809e80b477806b25218c8a3))
- **e2e:** add comprehensive error handling and performance tests ([def8199](https://github.com/wmitrus/nextjs-15-boilerplate/commit/def81993c390b0efb891090f64a3a250b63bbdbe))
- **msw:** implement Logflare API request handlers with success responses ([b8f02f5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/b8f02f58f8ef08982c2d7cac6154ab1adf6088b0))

# [1.4.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.3.0...v1.4.0) (2025-08-18)

### Features

- **plop:** install plop, nextjs templates and main plop file for api, routes and tests ([dec8c87](https://github.com/wmitrus/nextjs-15-boilerplate/commit/dec8c8756c93e47b486a8c27332f12d1cbb75b4f))

# [1.3.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.2.0...v1.3.0) (2025-03-30)

### Features

- **madge:** add madge and dpecheck to pre-push hook in husky ([02cc810](https://github.com/wmitrus/nextjs-15-boilerplate/commit/02cc8103fceffa26d75ce718a7e0710e4a289685))
- **madge:** add madge as global depenedency, add script to package.json ([63e41e2](https://github.com/wmitrus/nextjs-15-boilerplate/commit/63e41e2b7ff61acb64c64bd06358c990279d1d5d))
- **madge:** add madge as global depenedency, add script to package.json ([c60887b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/c60887be953d475072f4be8efc33a08c98e32985))
- **madge:** add madge as global depenedency, add script to package.json ([c34983c](https://github.com/wmitrus/nextjs-15-boilerplate/commit/c34983caf67b0f8e85adcfa7893cfa32f60b4f3f))
