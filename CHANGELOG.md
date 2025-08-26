# [1.13.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.12.0...v1.13.0) (2025-08-26)

### Bug Fixes

- **actions:** add dummy required envs to bundle-size workflow ([fd73bfe](https://github.com/wmitrus/nextjs-15-boilerplate/commit/fd73bfeb6c384633714ea7ec99751293c44a276f))
- **actions:** fix lisghthouse step to auto get preview url ([c24360b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/c24360b1ccf543e2581b74135d1c96400f91f57c))
- **analyze:** fix analyze script, use @next/bundle-analyzer, fix size-limit thresholds ([d0ac4f6](https://github.com/wmitrus/nextjs-15-boilerplate/commit/d0ac4f6f454988b09a967fd83b646702f81f24f3))
- **bundlewatch:** fix config and thresholds ([27f165b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/27f165bef3b57e7c52f3984e0fb8516a716ba704))
- **envs:** update upstash env types accroding to zod@4, and add them to unit tests ([273477b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/273477b2db84a0632e75611f18405a1be51eca7c))
- **redis:** update redis config in middleware ([41ee14a](https://github.com/wmitrus/nextjs-15-boilerplate/commit/41ee14a81871f99a4fe4ff3b4afa2dcbb94b2211))
- **scripts:** fix bundlewatch command name ([e16aab3](https://github.com/wmitrus/nextjs-15-boilerplate/commit/e16aab33e6847031b11583e9a7b62b264ea51cf3))

### Features

- **actions:** add bundle-size workflow action with bundlewatch integration ([f907c11](https://github.com/wmitrus/nextjs-15-boilerplate/commit/f907c11c312d13e865e25500bcba30b5b984e127))
- **bundle-analyzer:** add bundleAnalyzer to next config ([10d94ee](https://github.com/wmitrus/nextjs-15-boilerplate/commit/10d94eedd59b3a615788cd134ac2c3bf11757088))
- **bundlewatch:** add .bundlewatch.config.json config ([2e72f03](https://github.com/wmitrus/nextjs-15-boilerplate/commit/2e72f03ca0c0fe940a18959050099a56e6347f4c))
- **scripts:** add scripts realted to bundle analysis ([9b04f65](https://github.com/wmitrus/nextjs-15-boilerplate/commit/9b04f654b442e83387318991dcca73e433a023be))
- **size-limi:** configure size limit config in package.json ([c0eb1ee](https://github.com/wmitrus/nextjs-15-boilerplate/commit/c0eb1ee833b20c73cdae5bd2e5498e9a11f89de7))
- **upstash:** add upstashe envs into T3 ([6ba6156](https://github.com/wmitrus/nextjs-15-boilerplate/commit/6ba6156788e76612d8af23c76d6710487cdd5791))

# [1.12.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.11.0...v1.12.0) (2025-08-24)

### Features

- **upstash:** install, configure upstash, add it to middleware ([4af971d](https://github.com/wmitrus/nextjs-15-boilerplate/commit/4af971d8d83e25d744c2adc076aa686af73003ea))

# [1.11.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.10.0...v1.11.0) (2025-08-24)

### Bug Fixes

- **actions:** add @sentry/cli to pnpm install in vercel, fix labeler.yml format ([8a99b0d](https://github.com/wmitrus/nextjs-15-boilerplate/commit/8a99b0dfc1e06afe85bee6f59ad006e895c7be91))
- **actions:** add @sentry/cli to pnpm install in vercel, fix labeler.yml format ([0ce65a8](https://github.com/wmitrus/nextjs-15-boilerplate/commit/0ce65a8f560f256e412654f49be58b27295f000b))
- **actions:** add lighthouse config and accordingly change the action workflow ([fdd8d5f](https://github.com/wmitrus/nextjs-15-boilerplate/commit/fdd8d5f89565c2285ba3e06e4fbd81b65a44ba12))
- **actions:** change pull request type to only opened ([5b5e8bf](https://github.com/wmitrus/nextjs-15-boilerplate/commit/5b5e8bf5470943c62eefbc7d60733be907c3a1a4))
- **actions:** change set-label action type ([8d33d08](https://github.com/wmitrus/nextjs-15-boilerplate/commit/8d33d083bb214bbbc84c832660fa76efdc1e7a3c))
- **actions:** fix command for vercel preview runs sentry-cli from local global installation ([3db8974](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3db8974b3469571a08741d7edbd6183e8e1102f1))
- **actions:** fix command runs sentry-cli from local global installation ([f53c2c3](https://github.com/wmitrus/nextjs-15-boilerplate/commit/f53c2c3715a92b569f1b769d0eac45e006ec91b8))
- **actions:** fix config and add lhci-cli to dev deps ([22bccfb](https://github.com/wmitrus/nextjs-15-boilerplate/commit/22bccfbc64fc97c3ede798095d69ad0226e70a4d))
- **actions:** fix config layout, add checkout action to workflow fot label workflow ([794e4d0](https://github.com/wmitrus/nextjs-15-boilerplate/commit/794e4d0f0f9e2c28359cdb5d342ad423af06b17c))
- **actions:** fix config name to .lighthouserc.json ([2f1b949](https://github.com/wmitrus/nextjs-15-boilerplate/commit/2f1b949449732351757272c97374e4dc36b77b0d))
- **actions:** fix previously wrongly changed yml ([31bfbe5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/31bfbe5da21c20158b2d5e47d84e85e7b1b6cb87))
- **actions:** fix sentry-cli command ([90099a7](https://github.com/wmitrus/nextjs-15-boilerplate/commit/90099a7404464a85309f17ed8ce2642f3d2e9212))
- **config:** typedRoutes is not experimental any more, add productionBrowserSourceMaps: true ([586b92c](https://github.com/wmitrus/nextjs-15-boilerplate/commit/586b92c17ccd9b86566fa6a2f8d5a1b23704467a))

### Features

- **actions:** aadd typecheck action ([57397c7](https://github.com/wmitrus/nextjs-15-boilerplate/commit/57397c7bb8f4d8b36adc7039379d9ab795495e6e))
- **actions:** add auto-assign workflow action ([20869cb](https://github.com/wmitrus/nextjs-15-boilerplate/commit/20869cba2fb0e7b86e1c71f620d271d58248c5d9))
- **actions:** add PR labeler action ([a188b54](https://github.com/wmitrus/nextjs-15-boilerplate/commit/a188b54653e75e3e759a2ee7235fb73fed1e67a0))
- **actions:** add steps for vercel - Upload Source Maps to Sentry, preview: Run Lighthouse Audit ([eeee329](https://github.com/wmitrus/nextjs-15-boilerplate/commit/eeee3291db82415b9eef605dac8d605b4f180cb4))

# [1.10.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.9.0...v1.10.0) (2025-08-24)

### Features

- **sentry:** add server and client config ([954ab6b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/954ab6b5fa503dad54d3e9a54f91cc61f64b84b8))
- **sentry:** add server and client instrumentation ([73c47f4](https://github.com/wmitrus/nextjs-15-boilerplate/commit/73c47f4323806665e0044bf08066be3ab68e33b8))
- **sentry:** update nextjs config to work with sentry ([3418562](https://github.com/wmitrus/nextjs-15-boilerplate/commit/341856258fd752b62785af54ac539c10b5ca7d1f))
- **sentry:** update vercel actions, add sentry config to build steps ([b4bbe01](https://github.com/wmitrus/nextjs-15-boilerplate/commit/b4bbe0176334fcb40d7dde9aa31253f61bd16406))

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
