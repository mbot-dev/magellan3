import styled from "styled-components";
import { zipCodeFrom, telephoneFrom } from "../../../util/strings";
import { ENTITY_SPEC_CONTACT_INFO } from "./patientSpec";

const ContactInfo = ({ patient }) => {
  const { contacts, mobile, email } = patient;

  return contacts && (
    <Layout>
      <span>{TEXT_CONTACT}</span>
      <table className="w3-table">
        <tbody>
          {
            contacts.map(addr => {
              return (
                ENTITY_SPEC_CONTACT_INFO.attributes.map((attr, index) => {
                  const label = attr['label'];
                  const value = addr[attr['key']];
                  let concat;
                  if (index === 0) {
                    concat = `${label} ${zipCodeFrom(value)}`;
                  } else if (index === 2) {
                    concat = `${label} ${telephoneFrom(value)}`;
                  } else {
                    concat = value;
                  }
                  return (
                    <tr key={index}>
                      <MyTd>{concat}</MyTd>
                    </tr>
                  );
                })
              );
            })
          }
          {
            mobile &&
            <tr><MyTd>{`${TEXT_MOBILE} ${mobile}`}</MyTd></tr>
          }
          {
            email &&
            <tr><MyTd>{`${TEXT_EMAIL} ${email}`}</MyTd></tr>
          }
        </tbody>
      </table>
    </Layout>
  );
};

const Layout = styled.div`
    display: flex;
    flex-direction: column;
    over-flow: hidden;
`;

const MyTd = styled.td`
    padding: 4px 8px !important;
    white-space: pre;
`;

const TEXT_CONTACT = '連絡先';
const TEXT_MOBILE = 'モバイル';
const TEXT_EMAIL = '電子メール';

export default ContactInfo;

