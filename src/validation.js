import {isVal, isThenable, PromiseQueue} from 'crizmas-mvc';

export const validation = (...funcs) => {
  const validationPromiseQueue = new PromiseQueue();

  // make sure the function is not a constructor
  return ({
    function(...args) {
      let error;
      let promisedErrors = [];

      funcs.some((func) => {
        const validationResult = func.apply(this, args);

        if (isThenable(validationResult)) {
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

export const validate = (
  validationFunc,
  {
    events,
    ignoreEvent = false,
    target: targetFunc
  } = {}) => {
  let error;

  return ({input, event, target}) => {
    const validationResult = validationFunc({input, event, target});

    if (!validationResult) {
      error = null;
    } else if (error) {
      // it's possible that the error was changed
      error = validationResult;
    } else if (ignoreEvent
      || event === 'submit'
      // it's good to check the events first because based on that we might not need to check
      // the target as well which means that in the target function we can access variables
      // that may otherwise be uninitialized
      || (events || validate.events || ['blur']).includes(event)
        && target === (targetFunc ? targetFunc({input, event, target}) : input)) {
      error = validationResult;
    }

    return error;
  };
};

export const required = ({
  message,
  events,
  ignoreEvent
} = {}) => {
  return validate(
    ({input, event, target}) => {
      const value = input.getValue();

      if (value === '' || !isVal(value)) {
        return message && message({value, input, event, target})
          || required.message && required.message({value, input, event, target})
          || 'Required';
      }
    },

    {
      events: events || required.events,
      ignoreEvent
    });
};

export const min = (
  minValue,
  {
    message,
    events,
    ignoreEvent
  } = {}) => {
  return validate(
    ({input, event, target}) => {
      const value = input.getValue();

      if (typeof value === 'number' && value < minValue) {
        return message && message({minValue, value, input, event, target})
          || min.message && min.message({minValue, value, input, event, target})
          || `Minimum allowed is ${minValue}`;
      }
    },

    {
      events: events || min.events,
      ignoreEvent
    });
};

export const max = (
  maxValue,
  {
    message,
    events,
    ignoreEvent
  } = {}) => {
  return validate(
    ({input, event, target}) => {
      const value = input.getValue();

      if (typeof value === 'number' && value > maxValue) {
        return message && message({maxValue, value, input, event, target})
          || max.message && max.message({maxValue, value, input, event, target})
          || `Maximum allowed is ${maxValue}`;
      }
    },

    {
      events: events || max.events,
      ignoreEvent
    });
};

export const minLength = (
  minLength_,
  {
    message,
    events,
    ignoreEvent
  } = {}) => {
  return validate(
    ({input, event, target}) => {
      const value = input.getValue();

      if (typeof value === 'string' && value.length < minLength_) {
        return message && message({minLength: minLength_, value, input, event, target})
          || minLength.message
            && minLength.message({minLength: minLength_, value, input, event, target})
          || `Minimum allowed length is ${minLength_}`;
      }
    },

    {
      events: events || minLength.events,
      ignoreEvent
    });
};

export const maxLength = (
  maxLength_,
  {
    message,
    events,
    ignoreEvent
  } = {}) => {
  return validate(
    ({input, event, target}) => {
      const value = input.getValue();

      if (typeof value === 'string' && value.length > maxLength_) {
        return message && message({maxLength: maxLength_, value, input, event, target})
          || maxLength.message
            && maxLength.message({maxLength: maxLength_, value, input, event, target})
          || `Maximum allowed length is ${maxLength_}`;
      }
    },

    {
      events: events || maxLength.events,
      ignoreEvent
    });
};

export const async = (promiseFunc, {events} = {}) => {
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

    if (target === input && (events || async.events || ['change']).includes(event)) {
      const promise = promiseFunc(value);

      if (promise) {
        error = null;
        oldValue = value;

        return validationPromiseQueue.add(promise)
          .then(() => {
            return error;
          });
      }
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
