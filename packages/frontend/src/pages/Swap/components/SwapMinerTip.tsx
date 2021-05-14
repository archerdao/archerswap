import React from "react";
import { ThemeContext } from "styled-components";

import { CurrencyAmount } from "@archerswap/sdk";
import { useToggleSettingsMenu } from "state/application/hooks";
import {
  useUserTipManualOverride,
  useUserETHTip
} from "state/user/hooks";
import { useSwapCallArguments } from 'hooks/useSwapCallback'
import { useActiveWeb3React } from 'hooks/index';

import { RowBetween } from "components/Row";
import { ClickableText } from "pages/Pool/styleds";

import Slider from 'rc-slider';
import useFetchMinerTips from '../hooks/useFetchMinerTips.hook';
import useFetchEstimateGas from '../hooks/useFetchEstimateGas.hook';

import { SwapMinerTipProps, SwapInfo } from './SwapMinerTip.types'

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



export default function SwapMinerTip({trade, allowedSlippage, recipient }: SwapMinerTipProps ) {

  const [swapInfo, setSwapInfo] = React.useState<SwapInfo>({from: null, to: null, value: '0x100000000'});
  const swapCallBacks = useSwapCallArguments(trade, allowedSlippage, recipient);
  const { account } = useActiveWeb3React();
  const [estimatedGas] = useFetchEstimateGas(swapInfo);
 
  React.useEffect(() => {
    if(swapCallBacks.length > 0 && account) {
      const call = swapCallBacks[0];
      const {
        parameters: { value },
        contract
      } = call;
      setSwapInfo({
        to: contract.address,
        from: account,
        value
      });
    }
  }, [swapCallBacks]);

  
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

  const marks: Record<number, {label: string, price: string}>= React.useMemo(() => getMarksFromTips(tips), [tips]);
  
  const handleChange = React.useCallback(
    (newValue: number) => {
      setValue(newValue);
    },
    [setValue]
  );

  React.useEffect(() => {
    setValue(Math.floor(Object.values(marks).length / 2));
  }, [marks]);

  const max = Object.values(marks).length - 1;
  const isSliderVisible = !userTipManualOverride && max >= 0;
  const ethTip = isSliderVisible ? BigInt(marks[value].price) * BigInt(estimatedGas) : userETHTip;

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
