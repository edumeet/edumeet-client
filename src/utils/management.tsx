import { tenantLabel, undefinedLabel } from '../components/translated/translatedComponents';
import { Tenant, TenantOptionTypes, User, UserTypes } from './types';

export function getTenantName(tenants: TenantOptionTypes, id: string): string {
	
	const tenant: Tenant | undefined = tenants.find((t) => t.id == parseInt(id));

	if (tenant && tenant.name) {
		return tenant.name;
	}

	return `${undefinedLabel()} ${tenantLabel()}`;
}

export function getUserEmail(users: UserTypes, id: string): string {
	
	const user: User | undefined = users.find((t) => t.id == parseInt(id));

	if (user && user.email) {
		return user.email;
	} else {
		return 'Hidden email';
	}
}