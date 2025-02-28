import { createGlobalStyle } from "styled-components";

export const GlobalStyle = createGlobalStyle`
    html {
        --background: ${(props) => props.theme.background};
        --on-background: ${(props) => props.theme.onBackground};
        --surface: ${(props) => props.theme.surface};
        --on-surface: ${(props) => props.theme.onSurface};
        --margaret: #ffeb3b;
        --on-margaret: #212121;
        --primary: ${(props) => props.theme.primary};
        --on-primary: ${(props) => props.theme.onPrimary};
        --primary-selected: ${(props) => props.theme.primarySelected};
        --secondary: ${(props) => props.theme.secondary};
        --on-secondary: ${(props) => props.theme.onSecondary};
        --border-color: ${(props) => props.theme.borderColor};
        --karte: ${(props) => props.theme.karte};
        --on-karte: ${(props) => props.theme.onKarte};
        --accent: ${(props) => props.theme.accent};
        --soa: ${(props) => props.theme.soa};
        --on-soa: ${(props) => props.theme.onSoa};
        --on-header: ${(props) => props.theme.onHeader};
        --danger: ${(props) => props.theme.danger};
        --oral: ${(props) => props.theme.oral};
        --injection: ${(props) => props.theme.injection};
        --topical: ${(props) => props.theme.topical};
        --side-bar-width: 48px;
        --status-height: 24px;
        --patient-info-width: 25%;
        --index-cell-width: 90px;
        --data-cell-width: 360px;
        --dual-cell-width: 820px;
        --receipt-cell-width: 460px;
        --tensu-color: #4CAF50;
    }
`;
