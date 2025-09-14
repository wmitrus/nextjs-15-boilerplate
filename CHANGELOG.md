# [1.16.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.15.0...v1.16.0) (2025-09-14)

### Bug Fixes

- **feature-flags:** preserve original errors in hooks ([e3f6ab4](https://github.com/wmitrus/nextjs-15-boilerplate/commit/e3f6ab464cdc4b19f1c7116f18fd8b3adb28859a))
- **ui:** correct HTML entity in feature flag demo ([3dbc58c](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3dbc58c00691414a9efc59a17d27ddc8317882e3))

### Features

- **api:** add CSRF token handling for mutating client requests ([66fec1e](https://github.com/wmitrus/nextjs-15-boilerplate/commit/66fec1e15a98deabb355d50d29fc44917c669f03))
- **api:** add csrf-ping endpoint ([4a242ff](https://github.com/wmitrus/nextjs-15-boilerplate/commit/4a242ff510f870d0293a44f0c0f094ae8e9c788d))
- **app:** implement static rendering architecture with route groups ([8b92dcd](https://github.com/wmitrus/nextjs-15-boilerplate/commit/8b92dcd3d1c017a98ee78e359c0dd3acc8315841))
- **auth:** add Clerk testing dependency for enhanced auth flows ([8d18bbb](https://github.com/wmitrus/nextjs-15-boilerplate/commit/8d18bbbedb76169dece7cc5ade905014a4b31746))
- **auth:** implement comprehensive Clerk authentication with testing infrastructure ([c5761fd](https://github.com/wmitrus/nextjs-15-boilerplate/commit/c5761fd2fec0404d967ac895672ed2da0adff447))
- **auth:** implement server-side auth guards and Clerk components ([7c3ab62](https://github.com/wmitrus/nextjs-15-boilerplate/commit/7c3ab620576624dbd81fe79e508796ee7efe184d))
- **auth:** integrate Clerk authentication with dashboard and API user route ([bb5a2a0](https://github.com/wmitrus/nextjs-15-boilerplate/commit/bb5a2a0e5a61940352a3783067d09551e5089e4e))
- **clerk:** add mock support for clerk.com API in development ([88bc7d7](https://github.com/wmitrus/nextjs-15-boilerplate/commit/88bc7d7b026fb0ca8fea56e804053c0fc2b4784d))
- **client:** add csrfFetch utility for secure HTTP requests ([e77bae3](https://github.com/wmitrus/nextjs-15-boilerplate/commit/e77bae333f259c5c9f256b0409356b86e36d8c7b))
- **config:** add validation for API_RATE_LIMIT_WINDOW duration format ([82bbf03](https://github.com/wmitrus/nextjs-15-boilerplate/commit/82bbf03e9bc1ef4d57b32e91b415658882dcdf8e))
- **config:** define required env vars for environments ([3f47e54](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3f47e54a2efe9aba548c52987b63b96e8ebc971b))
- **dev:** add DevMocks component for MSW in development ([5e4b2fe](https://github.com/wmitrus/nextjs-15-boilerplate/commit/5e4b2fee4605c8f1a9b8d1c899eb32a299874d20))
- **examples:** add secure POST API route with JSON sanitization ([3c9b839](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3c9b839e742ce53f1b0722adc56729b1eb4d388d))
- **examples:** add secure POST example page with CSRF and sanitization ([4afe6ab](https://github.com/wmitrus/nextjs-15-boilerplate/commit/4afe6ab5c708f7f547764b0445d72e2d57674f39))
- **middleware:** add conditional local rate limiting for Clerk ([a72ee3e](https://github.com/wmitrus/nextjs-15-boilerplate/commit/a72ee3e82e575fd555f88623b53fbe5013328b76))
- **middleware:** add CORS preflight request handling ([68112d8](https://github.com/wmitrus/nextjs-15-boilerplate/commit/68112d81ab4ff32e3347d41614dd2ed98bc35127))
- **middleware:** add env var to disable rate limiting ([5819fd6](https://github.com/wmitrus/nextjs-15-boilerplate/commit/5819fd69fe899ae70c8a671aafe645dbc28707d7))
- **middleware:** implement API rate limiting and auth security headers ([7d6827b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/7d6827bb696a73be11a1b66a7ff08d91ef6f448e))
- **middleware:** merge tenant headers into response ([0468c6b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/0468c6befeded6a72a282261704e967573c35a8b))
- **plop:** add environment variable generator ([3b45a4d](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3b45a4d7708fdf8e4369d0adbaa41bb6f3937536))
- **rate-limit:** add API_RATE_LIMIT_ENABLED env var for runtime control ([dda6e19](https://github.com/wmitrus/nextjs-15-boilerplate/commit/dda6e19ce23879a413bec6d87a1380d5fe46f3ec))
- **rate-limit:** add in-memory rate limiter for local testing ([1ccccd5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/1ccccd511cae4b35bba14fdf5bcba128d3828c95))
- **rate-limit:** add Redis-based rate limiting utilities ([f1f53c0](https://github.com/wmitrus/nextjs-15-boilerplate/commit/f1f53c0dc1f0c3a9a17ab0a1d2318d6b8595a8a8))
- **security:** add CSP with nonce support and secure headers for Next.js ([c65a574](https://github.com/wmitrus/nextjs-15-boilerplate/commit/c65a574916227189c4b135f016a888b105a4dc6c))
- **security:** add CSRF API route for Edge runtime ([95aabad](https://github.com/wmitrus/nextjs-15-boilerplate/commit/95aabaded0ac9d81baf09703698b204d2c998d3d))
- **security:** add CSRF configuration module with TypeScript types ([4a95319](https://github.com/wmitrus/nextjs-15-boilerplate/commit/4a95319a6278a46773271cda2bd8d7861b39254c))
- **security:** add CSRF protection for Next.js Edge runtime ([a35a835](https://github.com/wmitrus/nextjs-15-boilerplate/commit/a35a835b968d83462f1b7d63c094ec0b952ca3a3))
- **security:** add CSRF token React hook ([e668dbd](https://github.com/wmitrus/nextjs-15-boilerplate/commit/e668dbd8e500de49a24850126c4f739485924360))
- **security:** add nonce context and strict input sanitization ([75102d7](https://github.com/wmitrus/nextjs-15-boilerplate/commit/75102d7ca6a94c52395aa5028c4abd8f2740e019))
- **security:** add nonce context example page and client demo ([46aa38a](https://github.com/wmitrus/nextjs-15-boilerplate/commit/46aa38a672c68563948accf4fb19d28c84816222))
- **security:** add safe JSON request body parser and sanitizer ([9f62cfa](https://github.com/wmitrus/nextjs-15-boilerplate/commit/9f62cfa9d406145d710749e6e22ec0660fbf8abd))
- **security:** add same-origin validation for API requests ([e1daaee](https://github.com/wmitrus/nextjs-15-boilerplate/commit/e1daaee82313ce71730e86e2dfc6d71712d14cb1))
- **security:** allow inline styles in preview environments ([84838b4](https://github.com/wmitrus/nextjs-15-boilerplate/commit/84838b4581c27ef2ead9a78a1cc10bdd65880ecc))
- **security:** enforce CSP, CSRF, and security headers in middleware ([200df58](https://github.com/wmitrus/nextjs-15-boilerplate/commit/200df586455e0c9908705443e23bfab423f6cf7b))
- **security:** provide CSP nonce via context in root layout ([7b37adb](https://github.com/wmitrus/nextjs-15-boilerplate/commit/7b37adb149b0d4ad0449d5cfb1cedbee8de9496b))
- **storybook:** add backgrounds configuration and globals css import ([4e10b2a](https://github.com/wmitrus/nextjs-15-boilerplate/commit/4e10b2a3c30c34143204a38ac7808ed9709a8a64))
- **tenant:** implement secure multi-tenant architecture with comprehensive validation and isolation ([f40c6e9](https://github.com/wmitrus/nextjs-15-boilerplate/commit/f40c6e916ac92fe961db9366905d0953ffd81268))
- **tenant:** improve multi-tenant disabled handling and error management ([aa545a7](https://github.com/wmitrus/nextjs-15-boilerplate/commit/aa545a743a1d8c19b1e0cd02e034388d0342d667))
- **ui:** add client-side wrapper for clerk user button ([1cdf2bd](https://github.com/wmitrus/nextjs-15-boilerplate/commit/1cdf2bd91b1b5078eddc51e4b2c6879bd3e690b4))
- **ui:** add link to secure POST example ([d309a57](https://github.com/wmitrus/nextjs-15-boilerplate/commit/d309a574bf348262cba60cb7cd6ad421a70cb2fd))
- **ui:** add navbar component with clerk auth integration ([b2ac5a2](https://github.com/wmitrus/nextjs-15-boilerplate/commit/b2ac5a2581d03910ab457071020e202f2114bc23))
- **vercel:** load pulled env file if present ([2a4b963](https://github.com/wmitrus/nextjs-15-boilerplate/commit/2a4b9637cad39ee81346cf4efbe104396f50bb70))

# [1.15.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.14.0...v1.15.0) (2025-09-03)

### Features

- **ui:** add form demo link to homepage ([15fee5d](https://github.com/wmitrus/nextjs-15-boilerplate/commit/15fee5db72c045506cd06e8903ba742677a6b449))

# [1.14.0](https://github.com/wmitrus/nextjs-15-boilerplate/compare/v1.13.0...v1.14.0) (2025-09-02)

### Bug Fixes

- **accessibility:** correct outline class for skip link to improve focus visibility ([0e4b48b](https://github.com/wmitrus/nextjs-15-boilerplate/commit/0e4b48bd847abfb719a88654f6bda4b2c698c497))
- **action:** add form demos and update CI env configuration ([8c494e5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/8c494e50c50de7a8c65bd6bb551f644a2f1d509a))
- **actions:** add checkout action to auto-assign playbook ([232a3ef](https://github.com/wmitrus/nextjs-15-boilerplate/commit/232a3ef210dc2f35128cd9e55f324b676c375f4a))
- **actions:** fix e2e test run ([e6cce57](https://github.com/wmitrus/nextjs-15-boilerplate/commit/e6cce578bcc7da6c5e296211ee7dd3a3cca2680d))
- **actions:** update envs in playwright playbook ([a21bbdc](https://github.com/wmitrus/nextjs-15-boilerplate/commit/a21bbdcfa6d327ff26b753b12c90963b5ba0cec2))
- **bundlewatch:** add new script for bundlewatch do package.json and use it in playbook ([ec0d9b5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/ec0d9b55643e8039ef998885a0f63e432062058d))
- **config:** log error when git branch detection fails ([0973e90](https://github.com/wmitrus/nextjs-15-boilerplate/commit/0973e904a659f88c2eb7873540bf99ba02318f57))
- **e2e:** add msw handler to ignore Next.js internal requests during E2E tests ([821827f](https://github.com/wmitrus/nextjs-15-boilerplate/commit/821827f288614e02da904feedb140ea578f6981e))
- **e2e:** add NODE_ENV=test to playwright command in config file ([6efc9c9](https://github.com/wmitrus/nextjs-15-boilerplate/commit/6efc9c992516289158321a22cb4346e15032d4d8))
- **e2e:** add require-in-the-middle to ignores ([b679c4f](https://github.com/wmitrus/nextjs-15-boilerplate/commit/b679c4f888df981f91381588cd01bc87b5f7fd11))
- **e2e:** add validation for Redis config, it is needed when run e2e test ([63d4cba](https://github.com/wmitrus/nextjs-15-boilerplate/commit/63d4cba425353bf85315a31fc6f1d9a777d32766))
- **e2e:** enhance thresholds in order to e2e and prod ([9566063](https://github.com/wmitrus/nextjs-15-boilerplate/commit/956606341f41199b9f6a9035b8da309df80c741c))
- **pino:** add env validation and error handling ([15df233](https://github.com/wmitrus/nextjs-15-boilerplate/commit/15df2330e42b575ccc2c3858638a2cd2ef10268e))
- **sentry:** disable tracesSampleRate for test on client side ([3fe6b06](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3fe6b06d2263305b0ab77ec61d268735feb42339))
- **sentry:** disable tracesSampleRate for test on server side and disable sentry on test env at all ([b3d34dd](https://github.com/wmitrus/nextjs-15-boilerplate/commit/b3d34dd1b008f09347dcb432a46e88c4938f6672))
- **sentry:** only instrument Sentry in non-test environments ([d1a7d62](https://github.com/wmitrus/nextjs-15-boilerplate/commit/d1a7d62af30e85d4eee9d69fd012f0cfd6eb283d))

### Features

- **accessibility:** enhance accessibility features and improve semantic HTML structure ([82fdaf5](https://github.com/wmitrus/nextjs-15-boilerplate/commit/82fdaf560351d54f925f5d563ae7523e39ad95d3))
- add comprehensive feature flags system ([f0d49c2](https://github.com/wmitrus/nextjs-15-boilerplate/commit/f0d49c2c5a97529bbb1278343e1ab3f764f7c2cf))
- **component:** add form demo pages and refactor config demo component ([27ea9ef](https://github.com/wmitrus/nextjs-15-boilerplate/commit/27ea9efa58dcf7fc46acce04cfd220f170d724d3))
- **config:** add centralized configuration system with env-based feature flags and tenant support ([56105ba](https://github.com/wmitrus/nextjs-15-boilerplate/commit/56105baf9eee4b1b3abf2daef5660914cfd2ca27))
- **config:** implement centralized configuration system with feature flags and tenant support ([a9c0508](https://github.com/wmitrus/nextjs-15-boilerplate/commit/a9c0508a6ab43db04258f78fdeab875a86aa9a1f))
- **dependencies:** add clsx and tailwind-merge for improved styling support ([8fd8593](https://github.com/wmitrus/nextjs-15-boilerplate/commit/8fd8593deae91f542bf9f53f366a285ac3d4f504))
- **env:** enhance environment management system ([deb1f76](https://github.com/wmitrus/nextjs-15-boilerplate/commit/deb1f76ccba1f0a63a8099a5a5d2f1107e1894a2))
- **forms:** add demo form page with Zod validation and submission handling ([e109655](https://github.com/wmitrus/nextjs-15-boilerplate/commit/e1096553c826292297634acdf4fd9202c7d8031f))
- **forms:** add ZodForm component with validation and submission handling ([3238940](https://github.com/wmitrus/nextjs-15-boilerplate/commit/32389402739de33495fbc6a8ac0c7849609bbbc8))
- **forms:** implement Zod form library with customizable field configurations and validation ([fb16cf9](https://github.com/wmitrus/nextjs-15-boilerplate/commit/fb16cf916a56c5de9286d435fc532527274945cd))
- implement multi-tenant architecture ([5a2ff7f](https://github.com/wmitrus/nextjs-15-boilerplate/commit/5a2ff7fd111d81afea75b09dfd4d60b6f49d06d5))
- **logger:** add client-safe logger for browser usage ([3a69c0d](https://github.com/wmitrus/nextjs-15-boilerplate/commit/3a69c0d74e672d32292e3883a97de13957ece242))
- **login:** implement login API with Zod validation and mock user authentication ([46cd2e8](https://github.com/wmitrus/nextjs-15-boilerplate/commit/46cd2e87a0dfd77609167ef40d935ff111410ed9))
- **login:** implement login page with form validation and response handling ([114fbed](https://github.com/wmitrus/nextjs-15-boilerplate/commit/114fbedbb2d80e60b3fa76deb46aa375b8e788b2))
- **middleware:** update middleware and API mocking ([48c5699](https://github.com/wmitrus/nextjs-15-boilerplate/commit/48c56996364d7fcad4670f55ef9ec061eeaaa5e0))
- **navigation:** update call-to-action links to direct users to the login page and explore features ([4652d69](https://github.com/wmitrus/nextjs-15-boilerplate/commit/4652d692e4ca82ce6e63f14fea7d7938a2d7b49a))
- **testing:** add comprehensive testing infrastructure ([cf4f61e](https://github.com/wmitrus/nextjs-15-boilerplate/commit/cf4f61ee8dd07040aa38aa806414f1061611b660))
- **ui:** add form and input components with react-hook-form integration ([eb12bc3](https://github.com/wmitrus/nextjs-15-boilerplate/commit/eb12bc3a9bbd95cdb7d37886de17ace10b817d0c))
- **ui:** add polymorphic element component for flexible html elements ([2650a18](https://github.com/wmitrus/nextjs-15-boilerplate/commit/2650a189d9481fa1c75af51f81661c5c09a77a18))
- **ui:** update app components and documentation ([58d501c](https://github.com/wmitrus/nextjs-15-boilerplate/commit/58d501c1ac2d7db9a91ffe8585e93f47bf880990))
- **utils:** add cn utility function for merging tailwind classes ([7ebf000](https://github.com/wmitrus/nextjs-15-boilerplate/commit/7ebf000c21fa56c87694c465519fbeb9152b2cd8))

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
