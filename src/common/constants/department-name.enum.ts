/**
 * Department Name Type
 *
 * Type alias for department name strings.
 *
 * @deprecated The functions getDepartmentNames() and setPrismaService() have been removed.
 * Please use DepartmentNamesService instead:
 *
 * ```typescript
 * import { DepartmentNamesService } from '../services/department-names.service';
 *
 * constructor(private readonly deptService: DepartmentNamesService) {}
 *
 * const names = await this.deptService.getDepartmentNames();
 * ```
 *
 * The DepartmentNamesService is provided globally via DepartmentNamesModule,
 * so you can inject it in any service or controller.
 */
export type DepartmentName = string;
