import styled from 'styled-components';
import Slider from "rc-slider";
import "rc-slider/assets/index.css";
 
export const StyledSlider = styled(Slider)`
  margin: .8rem auto 2rem auto;  
  width: 90% !important;

  .rc-slider-mark-text-active {
    color: #fff;
  }

  .rc-slider-rail {
    background-color: #fff;
  }

  .rc-slider-mark-text {
    color: #c3c5cb;
  }

  .rc-slider-track {
    background: linear-gradient(to right, #6caf527f, #6caf52);
  }

  .rc-slider-handle {
    border-color: #6caf52;
  }

  .rc-slider-handle:hover {
    border-color: #4caf52;
  }

  .rc-slider-handle-click-focused:focus {
    border-color: #6caf52;
  }

  .rc-slider-dot-active {
    border-color: #6caf52;
  }  
`
