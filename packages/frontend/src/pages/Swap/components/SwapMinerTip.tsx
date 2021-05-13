import React from "react";
import { ThemeContext } from "styled-components";

import { CurrencyAmount } from "@archerswap/sdk";
import { useToggleSettingsMenu } from "state/application/hooks";
import {
  useUserTipManualOverride,
  useUserETHTip
} from "state/user/hooks";

import { RowBetween } from "components/Row";
import { ClickableText } from "pages/Pool/styleds";

import Slider from 'rc-slider';
import useFetchMinerTips from '../hooks/useFetchMinerTips.hook';
import 'rc-slider/assets/index.css';

const styles = {
  slider: {
    margin: '.5rem 1rem 2rem 1rem'
  },
  text: {
    fontWeight: 500,
    fontSize: 14,
  }
};

const getMarksFromTips = (tips: Record<string, string>) => {
  return Object.keys(tips)
      .map((key: string) => ({
        label: key,
        value: BigInt(tips[key])
      }))
      .sort((left, right) => 
        (left.value < right.value ? -1 : left.value > right.value ? 1 : 0))
      .reduce((acc, tip, index) => {
        const { label } = tip;
        return {...acc, [index]: label };
      }, {});
}

export default function SwapMinerTip() {
  const theme = React.useContext(ThemeContext);
  const textStyles = {
    ...styles.text,
    color: theme.text2
  };

  const toggleSettings = useToggleSettingsMenu();
  const [userTipManualOverride] = useUserTipManualOverride();
  const [userETHTip] = useUserETHTip();
  const [tips] = useFetchMinerTips(userTipManualOverride);
  const [value, setValue] = React.useState<number>(0);

  const marks:Record<number, string> = React.useMemo(() => getMarksFromTips(tips), [tips]);
  
  const handleChange = React.useCallback(
    (newValue: number) => {
      setValue(newValue);
    },
    [setValue]
  );

  React.useEffect(() => {
    setValue(0);
  }, [tips]);

  const max = Object.values(marks).length - 1;
  const isSliderVisible = !userTipManualOverride && max >= 0;
  const ethTip = isSliderVisible ? tips[marks[value]] : userETHTip;

  return (
    <>
      <RowBetween align="center">
        <ClickableText {...textStyles} onClick={toggleSettings}>
          Miner Tip
        </ClickableText>
        <ClickableText {...textStyles} onClick={toggleSettings}>
          {CurrencyAmount.ether(ethTip).toExact()} ETH
        </ClickableText>
      </RowBetween>
      {isSliderVisible && (
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
