import styled from "styled-components";
import { ENTITY_SPEC_MAIN_INSURANCE, ENTITY_SPEC_PUBLIC_INSURANCE } from "./patientSpec";
import pvtFunc from "../../../models/pvtFunc";

const MainInsurance = ({ ins }) => {
    return (
        ENTITY_SPEC_MAIN_INSURANCE.attributes.map((prop) => {
            const { key, label, func, arg} = prop;
            const args = arg ? arg.map((a) => ins[a]) : [];
            return func ? (
                <tr key={key}>
                    <MyTd>{label}</MyTd>
                    <MyTd>{pvtFunc[func](...args)}</MyTd>
                </tr>
            ): (
                <tr key={key}>
                    <MyTd>{label}</MyTd>
                    <MyTd>{ins[key]}</MyTd>
                </tr>
            );
        })
    );
};

const PublicInsurance = ({ pub }) => {
    return (
        ENTITY_SPEC_PUBLIC_INSURANCE.attributes.map((prop, i) => {
            return (
                <MyTd key={i}>
                    <MyTd>{prop['label']}</MyTd>
                    <MyTd>{pub[prop['key']]}</MyTd>
                </MyTd>
            );
        })
    );
};

const InsuranceInfo = ({ patient }) => {
    const insurances = patient['healthInsurances'];
    return insurances && insurances.length > 0 ? (
        <Layout>
            <span>{TEXT_INSURANCE}</span>
            <table>
                {
                    insurances.map((ins, i) => {
                        return (
                            <tbody key={i}>
                                <MainInsurance ins={ins} />
                                {
                                    ins['publicInsurances'] && ins['publicInsurances'].length > 0 &&
                                    ins['publicInsurances'].map((pub, j) => {
                                        return (
                                            <PublicInsurance key={j} pub={pub} />
                                        );
                                    })
                                }
                            </tbody>
                        );
                    })
                }
            </table>
        </Layout>
    ) : (
        <div />
    );
};

const Layout = styled.div`
    display: flex;
    flex-direction: column;
`;

const MyTd = styled.td`
    padding: 4px 8px !important;
`;

const TEXT_INSURANCE = '健康保険';

export default InsuranceInfo;
