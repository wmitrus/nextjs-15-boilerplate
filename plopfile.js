/* eslint @typescript-eslint/no-require-imports: "off" */
const fs = require('fs');
const helpers = require('handlebars-helpers')();
const path = require('path');

function registerHandleBarHelpers(plop) {
  for (const prop in helpers) {
    // if it is not an already included "case" helper, than add the helper to plop
    if (!prop.toLowerCase().includes('case')) {
      plop.setHelper(prop, helpers[prop]);
    }
  }

  // overwrite "raw" helper afterwards, because it's not able to
  // avoid escaping of {{{{raw}}}} block content otherwise
  plop.setHelper('raw', (options) => {
    return options.fn(undefined);
  });

  // Custom helpers for our templates
  plop.setHelper('includes', (array, value) => {
    return array && array.includes && array.includes(value);
  });

  plop.setHelper('join', (array, separator) => {
    return array && array.join ? array.join(separator || ',') : '';
  });

  plop.setHelper('not', (value) => {
    return !value;
  });

  plop.setHelper('or', function () {
    return Array.prototype.slice.call(arguments, 0, -1).some(Boolean);
  });

  plop.setHelper('and', function () {
    return Array.prototype.slice.call(arguments, 0, -1).every(Boolean);
  });

  plop.setHelper('eq', (a, b) => {
    return a === b;
  });
}

function isUsingTypeScript() {
  return fs.existsSync(path.join(process.cwd(), 'tsconfig.json'));
}

const createTestFile = {
  forPage: true,
  forComponent: true,
  forApi: true,
};

module.exports = function (plop) {
  const isTS = isUsingTypeScript();

  registerHandleBarHelpers(plop);
  // plop.setHelper('eq', function)

  // New API route generator
  plop.setGenerator('Api', {
    description: 'Generate a Next.js API route',
    prompts: async function (inquirer) {
      let dynamicRoutes = [];
      const prompts = [
        {
          type: 'input',
          name: 'name',
          message: 'API route name?',
        },
      ];

      if (!isTS) {
        prompts.push({
          type: 'confirm',
          name: 'isTypeScript',
          message: 'Use TypeScript?',
          default: false,
        });
      }

      const basicAnswers = await inquirer.prompt(prompts);

      const methods = await inquirer.prompt([
        {
          type: 'checkbox',
          message: 'Select the methods you want to use (spacebar to select)',
          name: 'methods',
          choices: ['GET', 'POST', 'PUT', 'DELETE'],

          validate(answer) {
            if (answer.length === 0) {
              return 'You must choose at least one method.';
            }

            return true;
          },
        },
      ]);

      const { addDynamicRoutes } = await inquirer.prompt({
        type: 'confirm',
        name: 'addDynamicRoutes',
        message: 'Would you like to add dynamic routes?',
        default: false,
      });

      if (addDynamicRoutes) {
        let addMore = true;
        while (addMore) {
          const dynamicRouteAnswer = await inquirer.prompt({
            type: 'input',
            name: 'routeName',
            message: 'Enter a dynamic route slug:',
          });
          dynamicRoutes.push(dynamicRouteAnswer.routeName);

          // Ask if the user wants to add another dynamic route
          const addMoreAnswer = await inquirer.prompt({
            type: 'confirm',
            name: 'addMore',
            message: 'Would you like to add another dynamic route?',
            default: false,
          });
          addMore = addMoreAnswer.addMore;
        }
      }

      return {
        isTypeScript: isTS || basicAnswers.isTypeScript,
        name: basicAnswers.name,
        dynamicRoutes,
        hasDynamicRoutes: Boolean(dynamicRoutes.length),
        methods: methods.methods.map((method) => {
          return { type: method, dynamicRoutes };
        }),
      };
    },

    actions: function (data) {
      let path = `src/app/api/${data.name}`;
      let testPath = `src/app/api/${data.name}`;

      // Append dynamic routes to the path
      if (data.dynamicRoutes && data.dynamicRoutes.length > 0) {
        path += '/' + data.dynamicRoutes.map((route) => `[${route}]`).join('/');
        testPath +=
          '/' + data.dynamicRoutes.map((route) => `[${route}]`).join('/');
      }

      const extension = data.isTypeScript ? 'ts' : 'js';

      // Add the file name to the path
      path += `/route.${extension}`;
      testPath += `/route.test.${extension}`;

      const actions = [
        {
          type: 'add',
          path: path,
          templateFile: 'plop-templates/api/api-route.hbs', // Adjust this path as needed
        },
      ];

      if (createTestFile.forApi === true) {
        actions.push({
          type: 'add',
          path: testPath,
          templateFile: 'plop-templates/tests/api-route.hbs', // Adjust this path as needed
        });
      }

      return actions;
    },
  });

  // New component generator
  plop.setGenerator('Component', {
    description: 'Generate a React component',
    prompts: async function (inquirer) {
      const prompts = [
        {
          type: 'input',
          name: 'componentName',
          message: 'Component name?',
        },
        {
          type: 'input',
          name: 'type',
          message: 'Enter a component folder:',
        },
        {
          type: 'list',
          name: 'componentType',
          message: 'Select a component type',
          choices: ['basic', 'polymorphic'],
        },
        {
          type: 'confirm',
          name: 'withChildren',
          message: 'With children?',
          default: true,
        },
      ];

      if (!isTS) {
        prompts.push({
          type: 'confirm',
          name: 'isTypeScript',
          message: 'Use TypeScript?',
          default: false,
        });
      }

      const answers = await inquirer.prompt(prompts);

      const componentType = answers.componentType;
      const htmlElementAnswer =
        componentType === 'polymorphic' &&
        (await inquirer.prompt({
          type: 'input',
          name: 'htmlElement',
          message: 'Enter an html element to adapt:',
        }));

      return {
        isTypeScript: isTS || answers.isTypeScript,
        name: answers.componentName,
        type: answers.type === 'none' ? null : answers.type,
        componentType: answers.componentType,
        htmlElement: htmlElementAnswer.htmlElement,
        withChildren: answers.withChildren,
      };
    },

    actions: function (data) {
      const extension = data.isTypeScript ? 'tsx' : 'jsx';
      const path = data.type
        ? `src/components/{{dashCase type}}/{{dashCase name}}/{{pascalCase name}}.${extension}`
        : `src/components/{{dashCase name}}/{{pascalCase name}}.${extension}`;

      const testPath = data.type
        ? `src/components/{{dashCase type}}/{{dashCase name}}/{{pascalCase name}}.test.${extension}`
        : `src/components/{{dashCase name}}/{{pascalCase name}}.test.${extension}`;

      const actions = [
        {
          type: 'add',
          path: path,
          templateFile: 'plop-templates/components/component.hbs', // Adjust this path as needed
        },
      ];

      if (createTestFile.forComponent === true) {
        actions.push({
          type: 'add',
          path: testPath,
          templateFile: 'plop-templates/tests/component.hbs', // Adjust this path as needed
        });
      }

      return actions;
    },
  });

  // Env helper generator: add env variable scaffolding and update manifest
  plop.setGenerator('Env', {
    description:
      'Add environment variable placeholders and update required manifest',
    prompts: async function (inquirer) {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'key',
          message: 'Variable key (e.g., MY_FEATURE_FLAG)?',
        },
        {
          type: 'list',
          name: 'visibility',
          message: 'Visibility?',
          choices: [
            { name: 'Server-only (private)', value: 'server' },
            { name: 'Public (NEXT_PUBLIC_*)', value: 'public' },
          ],
        },
        {
          type: 'checkbox',
          name: 'requiredIn',
          message: 'Mark as required in environments:',
          choices: [
            { name: 'development', value: 'development' },
            { name: 'preview', value: 'preview' },
            { name: 'production', value: 'production' },
          ],
        },
        {
          type: 'input',
          name: 'defaultValue',
          message: 'Default placeholder value (optional):',
          default: '',
        },
        {
          type: 'input',
          name: 'comment',
          message: 'Short comment/help (optional):',
          default: '',
        },
      ]);

      // Normalize key for public
      const key =
        answers.visibility === 'public' &&
        !answers.key.startsWith('NEXT_PUBLIC_')
          ? `NEXT_PUBLIC_${answers.key}`
          : answers.key;

      return { ...answers, key };
    },
    actions: function (data) {
      const actions = [];

      // 1) Ensure key exists in .env.example with comment
      actions.push({
        type: 'modify',
        path: '.env.example',
        pattern:
          /# === Demo feature flags \(if used elsewhere in code\) ===[\s\S]*?FEATURE_BETA_FEATURES="false"/,
        template: (match) => {
          const line = `${data.key}="${data.defaultValue || ''}"${data.comment ? `  # ${data.comment}` : ''}`;
          return `${match}\n${line}`;
        },
      });

      // 2) Update config/env.required.json
      actions.push(function updateManifest() {
        const manifestPath = path.resolve('config/env.required.json');
        const text = fs.readFileSync(manifestPath, 'utf8');
        const json = JSON.parse(text);
        const add = (env) => {
          json[env] = json[env] || { required: [] };
          if (!json[env].required.includes(data.key))
            json[env].required.push(data.key);
        };
        for (const env of data.requiredIn || []) add(env);
        fs.writeFileSync(manifestPath, JSON.stringify(json, null, 2) + '\n');
        return `Updated ${manifestPath}`;
      });

      return actions;
    },
  });

  // New Middleware generator
  plop.setGenerator('Middleware', {
    description: 'Generate a Next.js middleware',
    prompts: async function (inquirer) {
      const prompts = [
        {
          type: 'input',
          name: 'name',
          message: 'Middleware name?',
        },
      ];

      if (!isTS) {
        prompts.push({
          type: 'confirm',
          name: 'isTypeScript',
          message: 'Use TypeScript?',
          default: false,
        });
      }

      const answers = await inquirer.prompt(prompts);

      return {
        isTypeScript: isTS || answers.isTypeScript,
        name: answers.name,
      };
    },

    actions: function (data) {
      const extension = data.isTypeScript ? 'ts' : 'js';
      const middlewarePath = `src/lib/middleware/${data.name}.${extension}`;
      const testPath = `src/lib/middleware/${data.name}.test.${extension}`;

      const actions = [
        {
          type: 'add',
          path: middlewarePath,
          templateFile: 'plop-templates/middleware/middleware.hbs',
        },
      ];

      if (createTestFile.forApi === true) {
        actions.push({
          type: 'add',
          path: testPath,
          templateFile: 'plop-templates/tests/middleware.hbs',
        });
      }

      return actions;
    },
  });

  // New Hook generator
  plop.setGenerator('Hook', {
    description: 'Generate a React custom hook',
    prompts: async function (inquirer) {
      const prompts = [
        {
          type: 'input',
          name: 'name',
          message: 'Hook name? (without "use" prefix)',
        },
      ];

      if (!isTS) {
        prompts.push({
          type: 'confirm',
          name: 'isTypeScript',
          message: 'Use TypeScript?',
          default: false,
        });
      }

      const answers = await inquirer.prompt(prompts);

      return {
        isTypeScript: isTS || answers.isTypeScript,
        name: answers.name,
      };
    },

    actions: function (data) {
      const extension = data.isTypeScript ? 'ts' : 'js';
      const hookPath = `src/lib/hooks/use${data.name}.${extension}`;
      const testPath = `src/lib/hooks/use${data.name}.test.${extension}`;

      const actions = [
        {
          type: 'add',
          path: hookPath,
          templateFile: 'plop-templates/hooks/hook.hbs',
        },
      ];

      if (createTestFile.forApi === true) {
        actions.push({
          type: 'add',
          path: testPath,
          templateFile: 'plop-templates/tests/hook.hbs',
        });
      }

      return actions;
    },
  });

  // New Utility generator
  plop.setGenerator('Utility', {
    description: 'Generate a utility/lib function',
    prompts: async function (inquirer) {
      const prompts = [
        {
          type: 'input',
          name: 'name',
          message: 'Utility name?',
        },
      ];

      if (!isTS) {
        prompts.push({
          type: 'confirm',
          name: 'isTypeScript',
          message: 'Use TypeScript?',
          default: false,
        });
      }

      const answers = await inquirer.prompt(prompts);

      return {
        isTypeScript: isTS || answers.isTypeScript,
        name: answers.name,
      };
    },

    actions: function (data) {
      const extension = data.isTypeScript ? 'ts' : 'js';
      const utilPath = `src/lib/${data.name}.${extension}`;
      const testPath = `src/lib/${data.name}.test.${extension}`;

      const actions = [
        {
          type: 'add',
          path: utilPath,
          templateFile: 'plop-templates/utils/util.hbs',
        },
      ];

      if (createTestFile.forApi === true) {
        actions.push({
          type: 'add',
          path: testPath,
          templateFile: 'plop-templates/tests/util.hbs',
        });
      }

      return actions;
    },
  });

  // New Page generator
  plop.setGenerator('Page', {
    description: 'Generate a Next.js Page route',
    prompts: async function (inquirer) {
      let dynamicRoutes = [];
      const prompts = [
        {
          type: 'input',
          name: 'name',
          message: 'Page route name?',
        },
      ];

      if (!isTS) {
        prompts.push({
          type: 'confirm',
          name: 'isTypeScript',
          message: 'Use TypeScript?',
          default: false,
        });
      }

      const basicAnswers = await inquirer.prompt(prompts);

      const { addDynamicRoutes } = await inquirer.prompt({
        type: 'confirm',
        name: 'addDynamicRoutes',
        message: 'Would you like to add dynamic routes?',
        default: false,
      });

      if (addDynamicRoutes) {
        let addMore = true;
        while (addMore) {
          const dynamicRouteAnswer = await inquirer.prompt({
            type: 'input',
            name: 'routeName',
            message: 'Enter a dynamic route slug:',
          });
          dynamicRoutes.push(dynamicRouteAnswer.routeName);

          // Ask if the user wants to add another dynamic route
          const addMoreAnswer = await inquirer.prompt({
            type: 'confirm',
            name: 'addMore',
            message: 'Would you like to add another dynamic route?',
            default: false,
          });
          addMore = addMoreAnswer.addMore;
        }
      }

      const { createLayout } = await inquirer.prompt({
        type: 'confirm',
        name: 'createLayout',
        message: 'Would you like to add layout file for this page?',
        default: false,
      });

      return {
        isTypeScript: isTS || basicAnswers.isTypeScript,
        name: basicAnswers.name,
        dynamicRoutes,
        hasDynamicRoutes: Boolean(dynamicRoutes.length),
        createLayout,
      };
    },

    actions: function (data) {
      let path = `src/app/${data.name}`;
      let testPath = `src/app/${data.name}`;

      // Append dynamic routes to the path
      if (data.dynamicRoutes && data.dynamicRoutes.length > 0) {
        path += '/' + data.dynamicRoutes.map((route) => `[${route}]`).join('/');
        testPath +=
          '/' + data.dynamicRoutes.map((route) => `[${route}]`).join('/');
      }
      const extension = data.isTypeScript ? 'tsx' : 'jsx';

      // Add the file name to the path
      const layoutPath = path + `/layout.${extension}`;
      path += `/page.${extension}`;
      testPath += `/page.test.${extension}`;

      const actions = [
        {
          type: 'add',
          path: path,
          templateFile: 'plop-templates/page/page-route.hbs', // Adjust this path as needed
        },
      ];

      if (createTestFile.forPage === true) {
        actions.push({
          type: 'add',
          path: testPath,
          templateFile: 'plop-templates/tests/page.test.hbs', // Adjust this path as needed
        });
      }

      if (data.createLayout === true) {
        actions.push({
          type: 'add',
          path: layoutPath,
          templateFile: 'plop-templates/page/page-layout.hbs', // Adjust this path as needed
        });
      }

      return actions;
    },
  });
};
