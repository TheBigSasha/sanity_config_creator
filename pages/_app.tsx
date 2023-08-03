import "../styles/globals.css";
import type { AppProps } from "next/app";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import {HoverDotsBackground} from "tbsui";
import React from "react";
import styled from "styled-components";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const SBackground = styled.span`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgb(0,0,0);
  z-index: -1;
  pointer-events: all;
`


function MyApp({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
        <SBackground>
            <HoverDotsBackground
                auraSize={450}
                auraColor={'rgba(137,255,242,0.64)'}
                background={'rgb(0,0,0)'}
                dotColor={'rgb(50,50,50)'}
                ambient={0.3}
                dotSize={2}
                dotOpacity={0.6}
                dotsBelow={true}
                style={{ position: 'fixed', top: 0, left: 0 }}
            />
        </SBackground>
        <Component {...pageProps} />{" "}
    </ThemeProvider>
  );
}

export default MyApp;
