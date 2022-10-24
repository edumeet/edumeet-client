/* eslint-disable no-unused-vars */
export type List<T extends { id: string }> = {
	add: (...items: T[]) => number;
	moveFirst: (item: T) => void;
	has: (item: T) => boolean;
	get: (id: string | number) => T | undefined;
	clear: () => number;
	remove: (item: T) => boolean;
	items: T[];
	length: number;
	empty: boolean;
}
/* eslint-enable no-unused-vars */

export const List = <T extends { id: string }>(
	...initialItems: T[]
): List<T> => {
	const items: T[] = [ ...initialItems ];
	const add: List<T>['add'] = (...newItems): number => items.push(...newItems);
	const moveFirst: List<T>['moveFirst'] = (item): void => {
		const index = items.indexOf(item);

		if (index > 0) {
			items.splice(index, 1);
			items.unshift(item);
		}
	};
	const has: List<T>['has'] = (item): boolean => items.includes(item);
	const get: List<T>['get'] = (id): T | undefined =>
		items.find((i) => i.id === id);
	const clear: List<T>['clear'] = (): number => (items.length = 0);
	const remove: List<T>['remove'] = (item): boolean => {
		const index = items.indexOf(item);

		if (index > -1) {
			items.splice(index, 1);

			return true;
		}

		return false;
	};

	return {
		add,
		moveFirst,
		has,
		get,
		clear,
		remove,
		items,
		get length(): number {
			return items.length;
		},
		get empty(): boolean {
			return items.length === 0;
		}
	};
};