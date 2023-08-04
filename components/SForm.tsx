import styled from "styled-components";

export const SForm = styled.form<{ isRoot?: boolean }>`
display: flex;
flex-direction: column;
gap: 0.15rem;
padding: ${({ isRoot }) => (!isRoot ? "0" : " 0.5rem 2rem 1rem 2rem")};
margin-top: ${({ isRoot }) => (!isRoot ? "0" : "25px")};
width: ${({ isRoot }) => (isRoot ? "clamp(300px, 80vw, 720px);" : "300px")};
`;


