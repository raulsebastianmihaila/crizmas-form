<a name="2.0.1"></a>
# [2.0.1](https://github.com/raulsebastianmihaila/crizmas-form/compare/v2.0.0...v2.0.1) (2021-08-22)

### Updates
- Updated crizmas-mvc peer and dev dependency.
- Updated jest, react and react-dom dev dependencies.

<a name="2.0.0"></a>
# [2.0.0](https://github.com/raulsebastianmihaila/crizmas-form/compare/v1.1.1...v2.0.0) (2021-01-01)

### Breaking changes
- Dropped support for non-module script tags.
- Moved from commonjs modules to standard ES modules, which means the structure of the exports changed: Input is not a property of Form anymore and validate, required, min, max, minLength, maxLength and async are not properties of validation anymore.
- messageFunc was renamed for all the validation functions that accepted it to 'message'.
- The default event for validate is now 'blur' instead the list made of 'change' and 'blur'.
- validate now calls the validation function with an object containing the input, event as target instead of the value.
- min, max, minLength and maxLength now are based on validate as required is so their default event will now be 'blur'.
- min and max now also check that the type of the value is 'number' before doing further validation.
- The validation function passed to async can now return a falsy value in which case async behaves as if the validation was skipped (for instance if the event didn't match).

### Updates
- Updated the crizmas-mvc peer dependency.
- Updated jest and crizmas-mvc dev dependencies.
- The message function will receive as an argument an object containing the input, event and target.
- validate, required, min, max, minLength and maxLength can pass an ignoreEvent option which causes the error to be reported even if the event doesn't match the list of expected events or if the target doesn't match.
- validate accepts a target function option which receives an object containing the input, event and target and if it is passed validate will check the target against the result of calling this function instead of checking it against the input.
- The default events for validate, required, min, max, minLength, maxLength and async can now be changed using validate.events, required.events, min.events, max.events, minLength.events, maxLength.events and async.events. These can be overwritten by passing an events option.

<a name="1.1.1"></a>
# [1.1.1](https://github.com/raulsebastianmihaila/crizmas-form/compare/v1.1.0...v1.1.1) (2018-12-08)

### Updates
- Enable strict mode in tests.
- Update crizmas-mvc, crizmas-async-utils, crizmas-utils and crizmas-promise-queue peer dependencies.
- Update crizmas-mvc, crizmas-async-utils, crizmas-utils, crizmas-promise-queue, react, react-dom, prop-types and jest dev dependencies for tests.
- Update package-lock for dev dependencies to fix jest vulnerabilities.

<a name="1.1.0"></a>
# [1.1.0](https://github.com/raulsebastianmihaila/crizmas-form/compare/v1.0.0...v1.1.0) (2018-04-21)

### Features
- `input.add` and `input.addChild` can receive an index as the second argument in order to insert the new child at that position.
- `validation` is now uses a promise queue in order to replace older pending validations.
- `validation.async` checks if the input's value changed during the async validation, in which case it doesn't use the new error anymore and also replaces the pending validation if the value was changed when the initiated validation is ignored.

### Fixes
- Fix typos in `validation.minLength` and `validation.maxLength`

### Updates
- Add tests.
- Add MIT license to package.json.
- Updated the versions of crizmas-mvc, crizmas-utils, crizmas-async-utils and crizmas-promise-queue peer dependencies.

<a name="1.0.0"></a>
# [1.0.0](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.10...v1.0.0) (2017-07-30)

### Updates
- Updated the versions of crizmas-mvc, crizmas-utils, crizmas-async-utils and crizmas-promise-queue peer dependencies.

<a name="0.2.10"></a>
# [0.2.10](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.9...v0.2.10) (2017-06-22)

### Updates
- Small style improvement.

<a name="0.2.9"></a>
# [0.2.9](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.8...v0.2.9) (2017-06-04)

### Updates
- Updated the version of crizmas-mvc peer dependency.

<a name="0.2.8"></a>
# [0.2.8](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.7...v0.2.8) (2017-05-28)

### Updates
- Added a `validate` function that accepts a validation function and a list of events.
- Refactored the `required` validation function to use the `validate` function.

<a name="0.2.7"></a>
# [0.2.7](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.6...v0.2.7) (2017-05-14)

### Updates
- Refactoring.
- Update versions of crizmas-mvc and crizmas-promise-queue peer dependencies.

<a name="0.2.6"></a>
# [0.2.6](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.5...v0.2.6) (2017-05-07)

### Updates
- Refactoring.
- Update versions of dependencies.

<a name="0.2.5"></a>
# [0.2.5](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.4...v0.2.5) (2017-04-29)

### Updates
- Ensure that functions that should not be constructed are not constructors.
- Small refactoring.
- Update versions of dependencies.

<a name="0.2.4"></a>
# [0.2.4](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.3...v0.2.4) (2017-04-21)

### Updates
- Updated peer dependencies versions.

<a name="0.2.3"></a>
# [0.2.3](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.2...v0.2.3) (2017-02-14)

### Updates
- Refactoring for consistent style.
- Updated peer dependencies versions.

<a name="0.2.2"></a>
# [0.2.2](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.1...v0.2.2) (2017-02-13)

### Fixes
- Fix the peer dependencies versions.

<a name="0.2.1"></a>
# [0.2.1](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.2.0...v0.2.1) (2016-12-30)

### Fixes
- Fix the peer dependencies versions.

<a name="0.2.0"></a>
# [0.2.0](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.1.2...v0.2.0) (2016-12-29)

### Breaking changes
- Add the `crizmas` namespace as a prop on `window`.

<a name="0.1.2"></a>
# [0.1.2](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.1.1...v0.1.2) (2016-12-27)

### Features
- Add the `clearValue` option.

<a name="0.1.1"></a>
# [0.1.1](https://github.com/raulsebastianmihaila/crizmas-form/compare/v0.1.0...v0.1.1) (2016-12-22)

### Fixes
- Add the `isPendingBlocked` prop to input instances.

<a name="0.1.0"></a>
# 0.1.0 (2016-12-21)

- Init
