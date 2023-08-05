# Developement notes

## Running end-to-end tests
In order to run Cypress e2e tests you will have to prepare and run Foundry
instance. It is recommended to setup it as follows:
- make sure that Foundry instance is ready to use, i.e. a licence is setup and
  all the necessary agreements are accepted
- Zweihander system is set up with all required modules
- there is no world with the same name as used by tests (check
  `testWorldData.name` in `cypress/e2e/foundryvtt/zweihander.cy.js`)
- administrator password is set to "admin" (see below if you want to use
  different password)

**Warning.** There is no test isolation, the current tests are more like a one
end to end scenario (with each test relying on the state left by the previous
one). Because of that if one of the tests fails, you will probably have to stop
Foundry, manually delete the test world and start Foundry again before being
able to rerun the tests.

### Tests configuration
If you want to run tests against other than standard Foundry URL, you can
provide it by using cypress configuration option `baseUrl`:
```sh
npx cypress open --config baseUrl=<URL>
```

If your Foundry instance has other administrator password than "admin", you can
set the `adminKey` env variable in your `cypress.env.json`.

For details and other methods of setting `baseUrl` and other options (including
environment variables), please consult the Cypress documentation.