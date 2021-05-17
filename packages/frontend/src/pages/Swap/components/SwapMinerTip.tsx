import React from "react";
import { ThemeContext } from "styled-components";

import { CurrencyAmount } from "@archerswap/sdk";
import { useToggleSettingsMenu } from "state/application/hooks";
import {
  useUserTipManualOverride,
  useUserETHTip,
  useUserGasPrice
} from "state/user/hooks";

import { RowBetween } from "components/Row";
import { ClickableText } from "pages/Pool/styleds";

import Slider from 'rc-slider';
import useFetchMinerTips from '../hooks/useFetchMinerTips.hook';

import 'rc-slider/assets/index.css';
import '../styles/slider.styles.css';


const styles = {
  slider: {
    margin: '.8rem 1rem 2rem 1rem'
  },
  text: {
    fontWeight: 500,
    fontSize: 14,
  }
};

const getMarkLabel = (index: number, length: number) : string => {
  switch(index) {
    case 0:
      return 'Cheap';
    case length - 1:
        return 'Fast';
    case Math.floor(length/2):
      return 'Balanced';
    default:
      return ''
  }
}

const getMarksFromTips = (tips: Record<string, string>) => {
  const length = Object.values(tips).length;
  return Object.values(tips)
    .sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1))
    .reduce(
      (acc, price, index) => ({
        ...acc,
        [index]: { label: getMarkLabel(index, length), price },
      }),
      {}
    );
};

export default function SwapMinerTip() {  
  const theme = React.useContext(ThemeContext);
  const textStyles = {
    ...styles.text,
    color: theme.text2
  };

  const toggleSettings = useToggleSettingsMenu();
  const [userTipManualOverride] = useUserTipManualOverride();
  const [userETHTip] = useUserETHTip();
  const [, setUserGasPrice] = useUserGasPrice();
  const [tips] = useFetchMinerTips(userTipManualOverride);
  const [value, setValue] = React.useState<number>(0);

  const marks: Record<number, {label: string, price: string}>= React.useMemo(() => getMarksFromTips(tips), [tips]);
  
  const handleChange = React.useCallback(
    (newValue: number) => {
      setValue(newValue);
      setUserGasPrice(marks[newValue].price);
    },
    [marks, setValue, setUserGasPrice]
  );

  React.useEffect(() => {
    if(Object.values(marks).length > 0) {
      const middleIndex = Math.floor(Object.values(marks).length / 2);
      setValue(middleIndex);
      setUserGasPrice(marks[middleIndex].price);
    }
  }, [marks, setUserGasPrice, setValue]);

  const max = Object.values(marks).length - 1;
  const isSliderVisible = !userTipManualOverride && max >= 0;

  return (
    <>
      <RowBetween align="center">
        <ClickableText {...textStyles} onClick={toggleSettings}>
          Miner Tip
        </ClickableText>
        <ClickableText {...textStyles} onClick={toggleSettings}>
          {CurrencyAmount.ether(userETHTip).toExact()} ETH
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
