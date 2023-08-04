import styled from "styled-components";

export const ResponsiveGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(600px, 1fr));
  grid-gap: 1rem;
  padding: 1rem;
  width: 100%;
  max-width: 100%;
  overflow: auto;
  min-height: calc(100vh - 12rem);
`;
