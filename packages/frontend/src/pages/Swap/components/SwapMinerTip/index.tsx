import React from "react";
import { ThemeContext } from "styled-components";

import { CurrencyAmount } from "@archerswap/sdk";
import { useToggleSettingsMenu } from "state/application/hooks";
import {
	useUserTipManualOverride,
	useUserETHTip
} from "state/user/hooks";

import Slider from 'rc-slider';
import { useFetchMinerTips, useCustomSlider } from './slider.hook';
import 'rc-slider/assets/index.css';
import './slider.styles.css';

import { RowBetween } from "components/Row";
import { ClickableText } from "pages/Pool/styleds";


const styles = {
	slider: {
		margin: '.5rem 1rem 2rem 1rem'
	},
	text: {
		fontWeight: 500,
		fontSize: 14,
	}
};


export default function SwapMinerTip() {
	const theme = React.useContext(ThemeContext);
	const textStyles = {
		...styles.text,
		color: theme.text2
	};

	const toggleSettings = useToggleSettingsMenu();
	const [userTipManualOverride] = useUserTipManualOverride();
	const [ethTip] = useUserETHTip();

	const [tips] = useFetchMinerTips<Record<string, string>>(userTipManualOverride);
	const [{ marks, value, max }, handleChange] = useCustomSlider(userTipManualOverride, tips);

	const ethTipText = React.useMemo(() => {
		if (userTipManualOverride) {
			return CurrencyAmount.ether(ethTip).toExact();
		} else {
			if (max > 0 && marks[value] && tips[marks[value]]) {
				return CurrencyAmount.ether(tips[marks[value]]).toExact();
			} else {
				return "Loading...";
			}
		}
	}, [userTipManualOverride, ethTip, tips, marks, value]);

	return (
		<>
			<RowBetween align="center">
				<ClickableText {...textStyles} onClick={toggleSettings}>
					Miner Tip
        </ClickableText>
				<ClickableText {...textStyles} onClick={toggleSettings}>
					{ethTipText}
				</ClickableText>
			</RowBetween>
			{!userTipManualOverride && (
				<section style={styles.slider}>
					<Slider
						defaultValue={0}
						marks={marks}
						max={max}
						onChange={handleChange}
						value={value}
						step={null}
					/>
				</section>
			)}
		</>
	);
}