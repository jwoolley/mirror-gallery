const deepMerge = require('../../../src/lib/util/deep-merge');

const first = {
	name: 'Firston Firstly',
	code: 1,
	urls: {
		default: 'https://default.first.com/first',
		one: 'https://one.first.com/first'
	},
	list: [
		1,
		{ listCode: 'first', itemFirst: 'iFirst' },
		[ 'one' ],
	]
};

const second = {
	name: 'Secund Secant',
	code: 2,
	urls: {
		default: 'https://default.second.com/second',
		two: 'https://two.second.com/second'
	},
	list: [
		2,
		{ listCode: 'second', itemSecond: 'iSecond' },
		[ 'two' ],
	]
};

console.log(deepMerge(first, second));