import React from "react";
import { ThemeContext } from "styled-components";
import { CurrencyAmount } from "@archerswap/sdk";
import { useToggleSettingsMenu } from "state/application/hooks";
import {
  useUserTipManualOverride,
  useUserETHTip,
  useUserGasPrice,
  useUserSlippageTolerance
} from "state/user/hooks";
import useArcherMinerTips from "hooks/useArcherMinerTips";
import { RowBetween } from "components/Row";
import { ClickableText } from "pages/Pool/styleds";
import { StyledSlider } from './styleds';

const getMarkLabel = (index: number, length: number): string => {
  switch (index) {
    case 0:
      return "Cheap";
    case length - 1:
      return "Fast";
    case Math.floor(length / 2):
      return "Balanced";
    default:
      return "";
  }
};
const getMarkSlippage = (index: number) : number => {
  if (index === 6) {
    return 50
  } else if (index === 5) {
    return 10
  } else if (index === 4) {
    return 5
  } else {
    return 0
  }
}

const getMarksFromTips = (tips: Record<string, string>) => {
  const length = Object.values(tips).length;
  return Object.values(tips)
    .sort((a, b) => (BigInt(a) < BigInt(b) ? -1 : 1))
    .reduce(
      (acc, price, index) => ({
        ...acc,
        [index]: { label: getMarkLabel(index, length), price, slippage: getMarkSlippage(index) },
      }),
      {}
    );
};

export default function MinerTip() {
  const theme = React.useContext(ThemeContext);
  const textStyleProps = {
    fontWeight: 500,
    fontSize: 14,
    color: theme.text2,
  };

  const toggleSettings = useToggleSettingsMenu();
  const [userTipManualOverride] = useUserTipManualOverride();
  const [userETHTip] = useUserETHTip();
  const [, setUserGasPrice] = useUserGasPrice();
  const [, setUserSlippageTolerance] = useUserSlippageTolerance();
  const { data: tips } = useArcherMinerTips();
  const [value, setValue] = React.useState<number>(0);

  const marks: Record<number, { label: string, price: string, slippage: number }> = React.useMemo(
    () => getMarksFromTips(tips),
    [tips]
  );

  const handleChange = React.useCallback(
    (newValue: number) => {
      setValue(newValue);
      setUserGasPrice(marks[newValue].price);
      setUserSlippageTolerance(marks[newValue].slippage);
    },
    [marks, setValue, setUserGasPrice, setUserSlippageTolerance]
  );

  React.useEffect(() => {
    if (Object.values(marks).length > 0) {
      const middleIndex = Math.floor(Object.values(marks).length / 2);
      setValue(middleIndex);
      setUserGasPrice(marks[middleIndex].price);
      setUserSlippageTolerance(marks[middleIndex].slippage);
    }
  }, [marks, setUserGasPrice, setValue, userTipManualOverride, setUserSlippageTolerance]);

  const max = Object.values(marks).length - 1;
  if( max < 0 && !userTipManualOverride ) return null;

  return (
    <>
      <RowBetween align="center">
        <ClickableText {...textStyleProps} onClick={toggleSettings}>
          Miner Tip
        </ClickableText>
        <ClickableText {...textStyleProps} onClick={toggleSettings}>
          {CurrencyAmount.ether(userETHTip).toFixed(3)} ETH
        </ClickableText>
      </RowBetween>
      {!userTipManualOverride && (
        <StyledSlider
          defaultValue={0}
          marks={marks}
          max={max}
          onChange={handleChange}
          value={value}
          step={null}
        />
      )}
    </>
  );
}
