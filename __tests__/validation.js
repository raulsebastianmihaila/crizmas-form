'use strict';

const Form = require('../src/form');
const validation = require('../src/validation');

const {Input} = Form;

describe('validation', () => {
  describe('validation', () => {
    test('if there are no errors undefined is returned', () => {
      expect.assertions(1);
      expect(validation()()).toBe(undefined);
    });

    test('first sync error is returned', () => {
      expect.assertions(1);
      expect(validation(
        () => 'error',
        () => 'error2')()).toBe('error');
    });

    test('all promise errors are reported', () => {
      expect.assertions(1);

      return validation(
        () => Promise.resolve('error1'),
        () => Promise.resolve(),
        () => Promise.resolve(['error2', 'error3']))().then((errors) => {
          expect(errors).toEqual(['error1', 'error2', 'error3']);
        });
    });

    test('if there is an async error, the result is always an array', () => {
      expect.assertions(1);

      return validation(() => Promise.resolve('error'))().then((errors) => {
        expect(errors).toEqual(['error']);
      });
    });

    test('all promises are awaited', () => {
      expect.assertions(3);

      const validationFuncObservation = jest.fn();
      const promiseThenObservation = jest.fn();

      return validation(
        () => Promise.resolve().then(() => Promise.resolve().then(() => {
          expect(promiseThenObservation.mock.calls.length).toBe(0);
          validationFuncObservation();
        })),
        () => Promise.resolve('error'))().then((errors) => {
          // 1 observed function call
          expect(validationFuncObservation.mock.calls.length).toBe(1);
          expect(errors).toEqual(['error']);
          promiseThenObservation();
        });
    });

    test('if sync error, async validations are ignored and the rest of the async validation'
      + ' functions are not called', () => {
      expect.assertions(3);

      const firstValidationFuncObservation = jest.fn();
      const thirdValidationFuncObservation = jest.fn();

      expect(validation(
        () => {
          firstValidationFuncObservation();

          return Promise.resolve('async error1');
        },
        () => 'sync error',
        () => {
          thirdValidationFuncObservation();

          return Promise.resolve('async error3');
        })()).toBe('sync error');
      // 1 observed function call
      expect(firstValidationFuncObservation.mock.calls.length).toBe(1);
      expect(thirdValidationFuncObservation.mock.calls.length).toBe(0);
    });

    test('integration with required', () => {
      expect.assertions(1);
      expect(validation(
        () => null,
        validation.required())({
          input: new Input({
            getValue: () => '',
            setValue() {}
          }),
          event: 'submit'
        })).toBe('Required');
    });

    test('integration with async', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      return validation(
        () => null,
        validation.async(() => Promise.resolve('error')))({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toEqual(['error']);
        });
    });

    test('integration with required and async', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => '',
        setValue() {}
      });

      expect(validation(
        validation.async(() => Promise.resolve('error')),
        validation.required())({
          input,
          target: input,
          event: 'change'
        })).toBe('Required');
    });

    test('older validation finishes earlier because of newer quicker validation', () => {
      expect.assertions(4);

      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      let isValidatingSlowly = true;
      const input = new Input();
      const validationFunc = validation(() => {
        if (isValidatingSlowly) {
          isValidatingSlowly = false;

          slowValidationObservation();

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve()).then(() => {
              finalSlowValidationObservation();
            });
        }

        return Promise.resolve('error');
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toEqual(['error']);
      });

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toEqual(['error']);
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });
    });

    test('older validation finishes earlier because of sync validation', () => {
      expect.assertions(4);

      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      let isAsyncValidation = true;
      const input = new Input();
      const validationFunc = validation(() => {
        if (isAsyncValidation) {
          isAsyncValidation = false;

          slowValidationObservation();

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve()).then(() => {
              finalSlowValidationObservation();
            });
        }

        return 'error';
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });

      expect(validationFunc({
        input,
        target: input,
        event: 'change'
      })).toBe('error');

      return promise;
    });
  });

  describe('validate', () => {
    test('invalid default submit', () => {
      expect.assertions(1);
      expect(validation.validate((value) => value === 'test' ? null : 'Invalid')({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Invalid');
    });

    test('valid default submit', () => {
      expect.assertions(1);
      expect(validation.validate((value) => value === 'test' ? null : 'Invalid')({
        event: 'submit',
        input: new Input({
          getValue: () => 'test',
          setValue() {}
        })
      })).toBe(null);
    });

    test('change and blur are default events with input as target', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate((value) => value === 'test' ? null : 'Invalid')({
        event: 'blur',
        input,
        target: input
      })).toBe('Invalid');
      expect(validation.validate((value) => value === 'test' ? null : 'Invalid')({
        event: 'change',
        input,
        target: input
      })).toBe('Invalid');
    });

    test('ignored error on unknown event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate((value) => value === 'test' ? null : 'Invalid')({
        event: 'custom',
        input,
        target: input
      })).toBe(undefined);
    });

    test('custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate(
        (value) => value === 'test' ? null : 'Invalid',
        {events: ['custom']})({
        event: 'custom',
        input,
        target: input
      })).toBe('Invalid');
    });

    test('error on non-submit event is ignored if target is not input', () => {
      expect.assertions(3);

      const input = new Input({
        getValue: () => 0,
        setValue() {}
      });

      expect(validation.validate((value) => value === 'test' ? null : 'Invalid')({
        event: 'blur',
        input
      })).toBe(undefined);
      expect(validation.validate((value) => value === 'test' ? null : 'Invalid')({
        event: 'change',
        input
      })).toBe(undefined);
      expect(validation.validate(
        (value) => value === 'test' ? null : 'Invalid',
        {events: ['custom']})({
        event: 'custom',
        input
      })).toBe(undefined);
    });

    test('if validation error is ignored the existing error is used', () => {
      expect.assertions(8);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.validate((value) =>
        value === 'test' ? null : validationMessage);

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Invalid');
      expect(validationFunc({
        event: 'change',
        input
      })).toBe('Invalid');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Invalid');

      inputValue = 'test';

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'change',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(4);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.validate((value) => value === 'test' ? null : 'Invalid');

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      inputValue = 'test';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'change',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });
  });

  describe('required', () => {
    test('undefined is required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Required');
    });

    test('null is required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe('Required');
    });

    test('empty string is required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Required');
    });

    test('0 is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe(null);
    });

    test('space is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => ' ',
          setValue() {}
        })
      })).toBe(null);
    });

    test('false is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => false,
          setValue() {}
        })
      })).toBe(null);
    });

    test('NaN is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => NaN,
          setValue() {}
        })
      })).toBe(null);
    });

    test('a symbol is not required', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => Symbol(),
          setValue() {}
        })
      })).toBe(null);
    });

    test('messageFunc is used', () => {
      expect.assertions(1);

      validation.required.messageFunc = () => 'Custom required message';

      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Custom required message');

      delete validation.required.messageFunc;
    });

    test('option messageFunc is used', () => {
      expect.assertions(1);
      expect(validation.required({
        messageFunc: () => 'Option required message'
      })({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Option required message');
    });

    test('option messageFunc overwrites required.messageFunc', () => {
      expect.assertions(1);

      validation.required.messageFunc = () => 'Custom required message';

      expect(validation.required({
        messageFunc: () => 'Overwriting option required message'
      })({
        event: 'submit',
        input: new Input({
          getValue() {},
          setValue() {}
        })
      })).toBe('Overwriting option required message');

      delete validation.required.messageFunc;
    });

    test('required validation on submit', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'submit',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe('Required');
    });

    test('required validation on change with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => null,
        setValue() {}
      });

      expect(validation.required()({
        event: 'change',
        input,
        target: input
      })).toBe('Required');
    });

    test('required validation on blur with input as target', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => null,
        setValue() {}
      });

      expect(validation.required()({
        event: 'blur',
        input,
        target: input
      })).toBe('Required');
    });

    test('no required validation on change without input as target', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'change',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('no required validation on blur without input as target', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'blur',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('no required validation on other events', () => {
      expect.assertions(1);
      expect(validation.required()({
        event: 'custom',
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('if validation error is ignored the existing error is used', () => {
      expect.assertions(8);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      let validationMessage = 'Invalid';
      const validationFunc = validation.required();

      validation.required.messageFunc = () => validationMessage;

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Invalid');

      validationMessage = 'Another validation message';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe('Invalid');
      expect(validationFunc({
        event: 'change',
        input
      })).toBe('Invalid');
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe('Invalid');

      inputValue = 'test';

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'change',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);

      delete validation.required.messageFunc;
    });

    test('non-submit event is not ignored even if target is not input if there\'s no error', () => {
      expect.assertions(4);

      let inputValue = null;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.required();

      expect(validationFunc({
        event: 'submit',
        input
      })).toBe('Required');

      inputValue = 'test';

      expect(validationFunc({
        event: 'blur',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'change',
        input
      })).toBe(null);
      expect(validationFunc({
        event: 'custom',
        input
      })).toBe(null);
    });
  });

  describe('min', () => {
    test('less value is invalid', () => {
      expect.assertions(1);
      expect(validation.min(3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Minimum allowed is 3');
    });

    test('greater value is valid', () => {
      expect.assertions(1);
      expect(validation.min(-3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('equal value is valid', () => {
      expect.assertions(1);
      expect(validation.min(-3)({
        input: new Input({
          getValue: () => -3,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('null is treated like 0', () => {
      expect.assertions(1);
      expect(validation.min(3)({
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe('Minimum allowed is 3');
    });

    test('undefined is not treated like 0', () => {
      expect.assertions(1);
      expect(validation.min(-3)({
        input: new Input({
          getValue: () => undefined,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('messageFunc is used', () => {
      expect.assertions(1);

      validation.min.messageFunc = ({value, minValue}) =>
        `Custom message: ${value} less than ${minValue}`;

      expect(validation.min(3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Custom message: 0 less than 3');

      delete validation.min.messageFunc;
    });

    test('option messageFunc is used', () => {
      expect.assertions(1);
      expect(validation.min(3, {
        messageFunc: ({value, minValue}) => `Option message: ${value} less than ${minValue}`
      })({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Option message: 0 less than 3');
    });

    test('option messageFunc overwrites min.messageFunc', () => {
      expect.assertions(1);

      validation.min.messageFunc = () => 'Custom min message';

      expect(validation.min(3, {
        messageFunc: ({value, minValue}) => `Overwritting message: ${value} less than ${minValue}`
      })({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Overwritting message: 0 less than 3');

      delete validation.min.messageFunc;
    });
  });

  describe('max', () => {
    test('greater value is invalid', () => {
      expect.assertions(1);
      expect(validation.max(-3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Maximum allowed is -3');
    });

    test('less value is valid', () => {
      expect.assertions(1);
      expect(validation.max(3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('equal value is valid', () => {
      expect.assertions(1);
      expect(validation.max(3)({
        input: new Input({
          getValue: () => 3,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('null is treated like 0', () => {
      expect.assertions(1);
      expect(validation.max(-3)({
        input: new Input({
          getValue: () => null,
          setValue() {}
        })
      })).toBe('Maximum allowed is -3');
    });

    test('undefined is not treated like 0', () => {
      expect.assertions(1);
      expect(validation.max(-3)({
        input: new Input({
          getValue: () => undefined,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('messageFunc is used', () => {
      expect.assertions(1);

      validation.max.messageFunc = ({value, maxValue}) =>
        `Custom message: ${value} greater than ${maxValue}`;

      expect(validation.max(-3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Custom message: 0 greater than -3');

      delete validation.max.messageFunc;
    });

    test('option messageFunc is used', () => {
      expect.assertions(1);
      expect(validation.max(-3, {
        messageFunc: ({value, maxValue}) => `Option message: ${value} greater than ${maxValue}`
      })({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Option message: 0 greater than -3');
    });

    test('option messageFunc overwrites max.messageFunc', () => {
      expect.assertions(1);

      validation.max.messageFunc = () => 'Custom max message';

      expect(validation.max(-3, {
        messageFunc: ({value, maxValue}) =>
          `Overwritting message: ${value} greater than ${maxValue}`
      })({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe('Overwritting message: 0 greater than -3');

      delete validation.max.messageFunc;
    });
  });

  describe('minLength', () => {
    test('less length is invalid', () => {
      expect.assertions(1);
      expect(validation.minLength(3)({
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Minimum allowed length is 3');
    });

    test('greater length is valid', () => {
      expect.assertions(1);
      expect(validation.minLength(-3)({
        input: new Input({
          getValue: () => 0,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('equal length is valid', () => {
      expect.assertions(1);
      expect(validation.minLength(-3)({
        input: new Input({
          getValue: () => -3,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('non-strings are not validated', () => {
      expect.assertions(1);
      expect(validation.minLength(3)({
        input: new Input({
          getValue: () => 1,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('messageFunc is used', () => {
      expect.assertions(1);

      validation.minLength.messageFunc = ({value, minLength}) =>
        `Custom message: ${value.length} less than ${minLength}`;

      expect(validation.minLength(3)({
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Custom message: 0 less than 3');

      delete validation.minLength.messageFunc;
    });

    test('option messageFunc is used', () => {
      expect.assertions(1);
      expect(validation.minLength(3, {
        messageFunc: ({value, minLength}) =>
          `Option message: ${value.length} less than ${minLength}`
      })({
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Option message: 0 less than 3');
    });

    test('option messageFunc overwrites minLength.messageFunc', () => {
      expect.assertions(1);

      validation.minLength.messageFunc = () => 'Custom min length message';

      expect(validation.minLength(3, {
        messageFunc: ({value, minLength}) =>
          `Overwritting message: ${value.length} less than ${minLength}`
      })({
        input: new Input({
          getValue: () => '',
          setValue() {}
        })
      })).toBe('Overwritting message: 0 less than 3');

      delete validation.minLength.messageFunc;
    });
  });

  describe('maxLength', () => {
    test('greater length is invalid', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 'abcd',
          setValue() {}
        })
      })).toBe('Maximum allowed length is 3');
    });

    test('less length is valid', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 'ab',
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('equal length is valid', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 'abc',
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('non-strings are not validated', () => {
      expect.assertions(1);
      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 1234,
          setValue() {}
        })
      })).toBe(undefined);
    });

    test('messageFunc is used', () => {
      expect.assertions(1);

      validation.maxLength.messageFunc = ({value, maxLength}) =>
        `Custom message: ${value.length} greater than ${maxLength}`;

      expect(validation.maxLength(3)({
        input: new Input({
          getValue: () => 'abcd',
          setValue() {}
        })
      })).toBe('Custom message: 4 greater than 3');

      delete validation.maxLength.messageFunc;
    });

    test('option messageFunc is used', () => {
      expect.assertions(1);
      expect(validation.maxLength(3, {
        messageFunc: ({value, maxLength}) =>
          `Option message: ${value.length} greater than ${maxLength}`
      })({
        input: new Input({
          getValue: () => 'abcd',
          setValue() {}
        })
      })).toBe('Option message: 4 greater than 3');
    });

    test('option messageFunc overwrites maxLength.messageFunc', () => {
      expect.assertions(1);

      validation.maxLength.messageFunc = () => 'Custom max length message';

      expect(validation.maxLength(3, {
        messageFunc: ({value, maxLength}) =>
          `Overwritting message: ${value.length} greater than ${maxLength}`
      })({
        input: new Input({
          getValue: () => 'abcd',
          setValue() {}
        })
      })).toBe('Overwritting message: 4 greater than 3');

      delete validation.maxLength.messageFunc;
    });
  });

  describe('async', () => {
    test('if the validation func doesn\'t return a promise an error is thrown', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      expect(() => validation.async(() => 'error')({
        input,
        target: input,
        event: 'change'
      })).toThrowError(Error);
    });

    test('valid input with default change event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 3,
        setValue() {}
      });

      return validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe(null);
      });
    });

    test('invalid input with default change event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 4,
        setValue() {}
      });

      return validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
      });
    });

    test('valid input with custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 3,
        setValue() {}
      });

      return validation.async(
        (value) => Promise.resolve(value === 3 ? null : 'error'),
        {events: ['custom']})({
        input,
        target: input,
        event: 'custom'
      }).then((err) => {
        expect(err).toBe(null);
      });
    });

    test('invalid input with custom event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });

      return validation.async(
        (value) => Promise.resolve(value === 3 ? null : 'error'),
        {events: ['custom']})({
        input,
        target: input,
        event: 'custom'
      }).then((err) => {
        expect(err).toBe('error');
      });
    });

    test('ignored event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => undefined,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input
      })).toBe(undefined);
    });

    test('ignored submit event', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => undefined,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'submit'
      })).toBe(undefined);
    });

    test('ignored event with value other than the undefined value that validation.async'
      + ' initially has', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 3,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input
      })).toBe(null);
    });

    test('ignored change event when target is not the input', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => undefined,
        setValue() {}
      });
      expect(validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        event: 'change'
      })).toBe(undefined);
    });

    test('if validation is skipped the existing error is used', () => {
      expect.assertions(2);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(validationFunc({input})).toBe('error');
      });
    });

    test('ignored event with changed value', () => {
      expect.assertions(2);

      let inputValue = 2;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');

        inputValue = 8;

        expect(validationFunc({
          input,
          target: input
        })).toBe(null);
      });
    });

    test('more recent value not reported as invalid because of old invalid value', () => {
      expect.assertions(4);

      let inputValue = 2;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');

        const promise = validationFunc({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toBe(null);
          expect(input.getValue()).toBe(3);
        });

        inputValue = 3;

        expect(validationFunc({
          input,
          target: input
        })).toBe(null);

        return promise;
      });
    });

    test('pending validation sets the old error to null', () => {
      expect.assertions(4);

      let inputValue = 2;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async((value) =>
        Promise.resolve(value === 3 ? null : 'error'));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');

        const promise = validationFunc({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toBe('error');
          expect(input.getValue()).toBe(2);
        });

        expect(validationFunc({input})).toBe(null);

        return promise;
      });
    });

    test('rejection is ignored', () => {
      expect.assertions(1);

      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => Promise.reject());

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).catch(() => {
        expect(validationFunc({input})).toBe(null);
      });
    });

    test('multiple pending validations', () => {
      expect.assertions(1);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => Promise.resolve(`error${++errorCount}`));

      return Promise.all([
        validationFunc({
          input,
          target: input,
          event: 'change'
        }),
        validationFunc({
          input,
          target: input,
          event: 'change'
        })
      ]).then((errors) => {
        expect(errors).toEqual(['error2', 'error2']);
      });
    });

    test('two temporally separate validations', () => {
      expect.assertions(2);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => Promise.resolve(`error${++errorCount}`));

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error1');

        return validationFunc({
          input,
          target: input,
          event: 'change'
        }).then((err) => {
          expect(err).toBe('error2');
        });
      });
    });

    test('ignored later settled validation', () => {
      expect.assertions(1);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        if (!errorCount) {
          return Promise.resolve().then(() => `error${++errorCount}`);
        }

        return Promise.resolve(`error${++errorCount}`);
      });

      return Promise.all([
        validationFunc({
          input,
          target: input,
          event: 'change'
        }),
        validationFunc({
          input,
          target: input,
          event: 'change'
        })
      ]).then((result) => {
        expect(result).toEqual(['error2', 'error2']);
      });
    });

    test('ignored slow rejected validation', () => {
      expect.assertions(2);

      let errorCount = 0;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        if (!errorCount) {
          const err = `error${++errorCount}`;

          return Promise.resolve().then(() => Promise.reject(err));
        }

        return Promise.resolve(`error${++errorCount}`);
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error2');
      });

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error2');
      });
    });

    test('slower previous validations are not awaited', () => {
      expect.assertions(2);

      const observation = jest.fn();
      let isValidatingSlowly = true;
      const input = new Input({
        getValue: () => 2,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        if (isValidatingSlowly) {
          isValidatingSlowly = false;

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => {
              observation();
            });
        }

        return Promise.resolve('error');
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(observation.mock.calls.length).toBe(0);
      });

      return promise;
    });

    test('older validation finishes earlier because of newer quicker validation', () => {
      expect.assertions(4);

      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      let isValidatingSlowly = true;
      const input = new Input();
      const validationFunc = validation.async(() => {
        if (isValidatingSlowly) {
          isValidatingSlowly = false;

          slowValidationObservation();

          return Promise
            .resolve()
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve())
            .then(() => Promise.resolve()).then(() => {
              finalSlowValidationObservation();
            });
        }

        return Promise.resolve('error');
      });

      validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
      });

      return validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('error');
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });
    });

    test('older validation finishes earlier when value is changed and the new validation'
      + ' is ignored', () => {
      expect.assertions(4);

      let inputValue = 2;
      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        slowValidationObservation();

        return Promise
          .resolve()
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve()).then(() => {
            finalSlowValidationObservation();
          });
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe(null);
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(0);
      });

      inputValue = 3;

      expect(validationFunc({input})).toBe(null);

      return promise;
    });

    test('ignored event doesn\'t finish pending validation earlier', () => {
      expect.assertions(4);

      let inputValue = 2;
      const slowValidationObservation = jest.fn();
      const finalSlowValidationObservation = jest.fn();
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });
      const validationFunc = validation.async(() => {
        slowValidationObservation();

        return Promise
          .resolve()
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve())
          .then(() => Promise.resolve()).then(() => {
            finalSlowValidationObservation();

            return 'err';
          });
      });

      const promise = validationFunc({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe('err');
        expect(slowValidationObservation.mock.calls.length).toBe(1);
        expect(finalSlowValidationObservation.mock.calls.length).toBe(1);
      });

      expect(validationFunc({input})).toBe(null);

      return promise;
    });

    test('if value changes after the validation was initiated the error is ignored', () => {
      expect.assertions(1);

      let inputValue = 4;
      const input = new Input({
        getValue: () => inputValue,
        setValue() {}
      });

      const promise = validation.async((value) => Promise.resolve(value === 3 ? null : 'error'))({
        input,
        target: input,
        event: 'change'
      }).then((err) => {
        expect(err).toBe(null);
      });

      inputValue = 5;

      return promise;
    });
  });
});
