import { registerDecorator, ValidationOptions } from 'class-validator';

// Requires at least one letter and one digit on top of the existing @MinLength(8).
// Deliberately does not mandate special characters or upper/lowercase mixes: per
// NIST 800-63B, length and breadth of character set matter far more for resisting
// brute force than arbitrary complexity rules, which mostly just push users toward
// predictable substitutions (e.g. "Password1!").
const PASSWORD_PATTERN = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function IsStrongPassword(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isStrongPassword',
      target: object.constructor,
      propertyName,
      options: {
        message: 'password must contain at least one letter and one number',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && PASSWORD_PATTERN.test(value);
        },
      },
    });
  };
}
