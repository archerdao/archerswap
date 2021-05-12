import React from 'react';

function useFetchMinerTips<D>(isManualMode: boolean) {
	const [data, setData] = React.useState<Record<string, string>>({});

	React.useEffect(() => {
		if (isManualMode) return;

		fetch('https://api.archerdao.io/v1/gas', {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				'Referrer-Policy': 'no-referrer'
			}
		})
			.then(response => response.json())
			.then(response => {
				setData(response.data);
			})
			.catch(error => console.error('Failed to fetch miner tips', error));
	}, [isManualMode]);

	return [data];
}

interface UserSliderResponse {
	marks: Record<number, string>,
	value: number
	max: number
};

function useCustomSlider(tips: Record<string, string>): [UserSliderResponse, (value: number) => void] {
	const [value, setValue] = React.useState<number>(0);

	const handleChange = React.useCallback(
		(newValue: number) => {
			setValue(newValue);
		},
		[setValue]
	);

	React.useEffect(() => {
		setValue(0);
	}, [tips]);

	const marks = React.useMemo(() => {
		let sortedTips =
			Object.keys(tips).map((key: string) => ({
				label: key,
				value: BigInt(tips[key])
			}))
				.sort((left, right) => (left.value < right.value ? -1 : left.value > right.value ? 1 : 0));

		let marks: Record<number, string> = {};
		sortedTips.forEach((tip, index) => {
			marks[index] = tip.label;
		});
		return marks;
	}, [tips]);

	const max = Object.values(marks).length - 1;

	return [
		{ marks, value, max },
		handleChange
	];
}

export {
	useFetchMinerTips,
	useCustomSlider
};