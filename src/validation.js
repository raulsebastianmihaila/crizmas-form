(() => {
  'use strict';

  const isModule = typeof module === 'object' && typeof module.exports === 'object';

  let PromiseQueue;
  let utils;

  if (isModule) {
    PromiseQueue = require('crizmas-promise-queue');
    utils = require('crizmas-utils');
  } else {
    ({PromiseQueue, utils} = window.crizmas);
  }

  const {isVal, isPromise} = utils;

  const validation = (...funcs) => {
    const validationPromiseQueue = new PromiseQueue();

    // make sure the function is not a constructor
    return ({
      function(...args) {
        let error;
        let promisedErrors = [];

        funcs.some((func) => {
          const validationResult = func.apply(this, args);

          if (isPromise(validationResult)) {
            promisedErrors.push(validationResult);
          } else {
            error = validationResult;

            return error;
          }
        });

        if (error) {
          // override possible pending validation result and also potentially
          // trigger the pending state update earlier on the input controller
          validationPromiseQueue.add(Promise.resolve(error));

          return error;
        }

        if (promisedErrors.length) {
          return validationPromiseQueue.add(Promise.all(promisedErrors).then((results) => {
            const errors = [];

            results.forEach((result) => {
              if (result) {
                if (Array.isArray(result)) {
                  errors.push(...result);
                } else {
                  errors.push(result);
                }
              }
            });

            return errors;
          }));
        }
      }
    }).function;
  };

  validation.validate = (validationFunc, {events = ['change', 'blur']} = {}) => {
    let error;

    return ({input, event, target}) => {
      const value = input.getValue();
      const validationResult = validationFunc(value);

      if (!validationResult) {
        error = null;
      } else if (event === 'submit' || target === input && events.includes(event)) {
        error = validationResult;
      }

      return error;
    };
  };

  validation.required = ({messageFunc} = {}) => {
    return validation.validate((value) => {
      if (value === '' || !isVal(value)) {
        return messageFunc && messageFunc()
          || validation.required.messageFunc && validation.required.messageFunc()
          || 'Required';
      }
    });
  };

  validation.min = (minValue, {messageFunc} = {}) => {
    return ({input}) => {
      const value = input.getValue();

      if (value < minValue) {
        return messageFunc && messageFunc({minValue, value})
          || validation.min.messageFunc && validation.min.messageFunc({minValue, value})
          || `Minimum allowed is ${minValue}`;
      }
    };
  };

  validation.max = (maxValue, {messageFunc} = {}) => {
    return ({input}) => {
      const value = input.getValue();

      if (value > maxValue) {
        return messageFunc && messageFunc({maxValue, value})
          || validation.max.messageFunc && validation.max.messageFunc({maxValue, value})
          || `Maximum allowed is ${maxValue}`;
      }
    };
  };

  validation.minLength = (minLength, {messageFunc} = {}) => {
    return ({input}) => {
      const value = input.getValue();

      if (typeof value === 'string' && value.length < minLength) {
        return messageFunc && messageFunc({minLength, value})
          || validation.minLength.messageFunc
            && validation.minLength.messageFunc({minLength, value})
          || `Minimum allowed length is ${minLength}`;
      }
    };
  };

  validation.maxLength = (maxLength, {messageFunc} = {}) => {
    return ({input}) => {
      const value = input.getValue();

      if (typeof value === 'string' && value.length > maxLength) {
        return messageFunc && messageFunc({maxLength, value})
          || validation.maxLength.messageFunc
            && validation.maxLength.messageFunc({maxLength, value})
          || `Maximum allowed length is ${maxLength}`;
      }
    };
  };

  validation.async = (promiseFunc, {events = ['change']} = {}) => {
    let error;
    let oldValue;
    let input;

    const validationPromiseQueue = new PromiseQueue({
      done: (err) => {
        const value = input.getValue();

        if (value === oldValue) {
          error = err;
        }

        oldValue = value;
      }
    });

    return ({input: input_, event, target}) => {
      input = input_;

      const value = input.getValue();

      if (target === input && events.includes(event)) {
        error = null;
        oldValue = value;

        return validationPromiseQueue.add(promiseFunc(value))
          .then(() => {
            return error;
          });
      }

      if (value !== oldValue) {
        // override possible pending validation result and also potentially
        // trigger the pending state update earlier on the input controller
        validationPromiseQueue.add(Promise.resolve(null));

        error = null;
      }

      oldValue = value;

      return error;
    };
  };

  const moduleExports = validation;

  if (isModule) {
    module.exports = moduleExports;
  } else {
    window.crizmas.validation = moduleExports;
  }
})();
