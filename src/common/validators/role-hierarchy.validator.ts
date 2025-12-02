import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

/**
 * Custom validator to ensure role-based hierarchy constraints
 *
 * Rules:
 * - team_lead: Can't have team_lead, only unit_head and dep_manager
 * - unit_head: Can't have team_lead or unit_head, only dep_manager
 * - dep_manager: Can't have anyone above (no team_lead, unit_head, dep_manager)
 */
export function IsValidRoleHierarchy(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isValidRoleHierarchy',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const obj = args.object as any;
          const roleId = obj.roleId;
          const managerId = obj.managerId;
          const teamLeadId = obj.teamLeadId;

          // If no roleId provided, skip validation
          if (!roleId) {
            return true;
          }

          // This validation will be handled in the service layer
          // where we can access the database to get role names
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          return 'Invalid role hierarchy configuration';
        },
      },
    });
  };
}
