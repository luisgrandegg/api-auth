/*
 * Copyright (c) inSided BV
 */

/*jslint node: true */
'use strict';

module.exports = function (grunt) {

  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({

    config: {
      httpp: 3000, // http port
      httpsp: 3001, // https port
      database: {
        name: 'api',
        host: '127.0.0.1'
      },
      createUser: 'no',
      user: {
        fullName: '',
        email: '',
        password: ''
      }
    },

    pkg: grunt.file.readJSON('package.json'),

    concurrent: {
      dev: {
        // Change shell:elasticsearch task to whatever task you want to run in parallel to node server
        tasks: ['nodemon:dev'],
        options: {
          logConcurrentOutput: true
        },
      }
    },

    external_daemon: {
      mongodb: {
        options: {
          verbose: false,
          startCheckTimeout: false,
          startCheck: function (stdout, stderr) {
            return /waiting for connections/.test(stdout);
          }
        },
        cmd: 'mongod',
        args: []
      }
    },

    shell: {
      // Change this command to whatever command you want to run in parallel to node server
      ebGetLastVersion: {
        command: 'echo `git fetch && git tag | sort -t. -k1,1n -k2,2n -k 3,3n | tail -1` > version',
        options: {
          async: false,
        }
      },
      ebZipSrc: {
        command: 'zip -r -X ../deploy-versions/`cat ../version`.zip *',
        options: {
          async: false,
          execOptions: {
            cwd: 'src/'
          }
        }
      },
      ebZipPackageJson: {
        command: 'zip -r deploy-versions/`cat version`.zip package.json',
        options: {
          async: false
        }
      },
      ebZipEbextensions: {
        command: 'zip -r ../deploy-versions/`cat ../version`.zip .ebextensions',
        options: {
          async: false,
          execOptions: {
            cwd: 'ebs-nodejs-skel/'
          }
        }
      },
      ebZipVersion: {
        command: 'zip -r -X deploy-versions/`cat version`.zip version',
        options: {
          async: false,

        }
      }
    },

    nodemon: {
      dev: {
        script: 'src/index.js',
        options: {
          cwd: __dirname,
          ignore: ['README.md'],
          watch: ['src'],
          ext: 'js',
          delay: 1000,
          legacyWatch: true
        }
      }
    },

    clean: {
      dist: ['web/development/js/dist/'],
      dsStore: ['*/**/.DS_Store'],
      version: ['version']
    },

    prompt: {
      configure: {
        options: {
          questions: [{
            config: 'config.database.name', // Database name
            type: 'input', // list, checkbox, confirm, input, password
            message: 'Write a name for MongoDB schema', // Question to ask the user, function needs to return a string,
            default: 'api' // default value if nothing is entered
          }, {
            config: 'config.database.host', // Database host
            type: 'input', // list, checkbox, confirm, input, password
            message: 'MongoDB host', // Question to ask the user, function needs to return a string,
            default: '127.0.0.1' // default value if nothing is entered
          }, {
            config: 'config.httpp', // API port
            type: 'input', // list, checkbox, confirm, input, password
            message: 'HTTP port', // Question to ask the user, function needs to return a string,
            default: 4000 // default value if nothing is entered
          }, {
            config: 'config.httpsp', // API SSL port
            type: 'input', // list, checkbox, confirm, input, password
            message: 'HTTPS port', // Question to ask the user, function needs to return a string,
            default: 4001 // default value if nothing is entered
          }, {
            config: 'config.createUser', // ¿Create admin user?
            type: 'list', // list, checkbox, confirm, input, password
            choices: ['yes', 'no'],
            message: 'Insert first admin user in Database?', // Question to ask the user, function needs to return a string,
            default: 'yes' // default value if nothing is entered
          }, {
            config: 'config.user.fullName', // Database host
            type: 'input', // list, checkbox, confirm, input, password
            message: 'Full name',
            when: function (answers) {
              return answers["config.createUser"] === 'yes';
            }
          }, {
            config: 'config.user.email', // Database host
            type: 'input', // list, checkbox, confirm, input, password
            message: 'E-mail',
            validate: function (value) {
              var email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
              return email.test(value);
            },
            when: function (answers) {
              return answers["config.createUser"] === 'yes';
            }
          }, {
            config: 'config.user.password', // Database host
            type: 'password', // list, checkbox, confirm, input, password
            message: 'Password',
            when: function (answers) {
              return answers["config.createUser"] === 'yes';
            }
          }]
        }
      },
    },

    replace: {
      params: {
        src: ['./src/config/params.js'], // source files array (supports minimatch)
        overwrite: true,
        replacements: [{
          from: 'httpp: 4000, // http port', // string replacement
          to: 'httpp: <%= config.httpp %>, // https port'
        }, {
          from: 'httpsp: 4001, // https port', // string replacement
          to: 'httpsp: <%= config.httpsp %>, // https port'
        }, {
          from: 'name: \'nodeapiseed\', // Database name', // string replacement
          to: 'name: \'<%= config.database.name %>\', // Database name'
        }, {
          from: 'host: \'127.0.0.1\', // Database host', // string replacement
          to: 'host: \'<%= config.database.host %>\', // Database host'
        }]
      },
      testendpoint: {
        src: ['./test/globals.js'], // global for testing
        overwrite: true,
        replacements: [{
          from: 'port: \'4000\', // API port', // api end-point
          to: 'port: \'<%= config.httpp %>\', // API port'
        }]
      }
    },

  });

  // Install task
  grunt.registerTask('configure', ['prompt:configure', 'replace:params', 'replace:testendpoint', 'external_daemon:mongodb', 'shell:createUser']);

  // Default task
  grunt.registerTask('default', ['external_daemon:mongodb', 'concurrent:dev']);

  // Test
  grunt.registerTask('test', ['shell:test']);

  grunt.registerTask('deploy', ['clean:dsStore', 'shell:ebGetLastVersion', 'shell:ebZipSrc', 'shell:ebZipPackageJson', 'shell:ebZipEbextensions', 'shell:ebZipVersion', 'clean:version']);

};
