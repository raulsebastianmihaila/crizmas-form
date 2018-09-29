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
