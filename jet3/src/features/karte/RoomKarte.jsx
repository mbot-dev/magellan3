import styled from "styled-components";
import { useStateValue } from "../../reducers/state";
import Inspector from "./Inspector";
import DiagnosisChanger from "./board/DignosisChanger";
import BundleChanger from "./board/BundleChanger";
import InputChanger from "./board/InputChanger";
import SchemaPanel from "./media/SchemaPanel";
import SchemaEditor from "./media/SchemaEditor";
import ImageUploader from "./media/ImageUploader";
import PDFUploader from "./media/PDFUploader";
import InputEditor from "./board/InputEditor";
import KarteTab from "./karteTab";
import withDisplayBlock from "../../aux/withDisplayBlock";
import { KarteProvider } from "./karteState";
import { initialKarteState, karteReducer } from "./karteReducer";

// patientList（患者リスト）をInspectorにmappingする
const RoomKarte = () => {
  const {
    patientList,
    currentPatient,
    showSchemaPanel,
    inputToEdit,
    diagnosisToChange,
    bundleToChange,
    inputToChange,
    schemaToEdit,
    imageFileToUpload,
    pdfFileToUpload,
  } = useStateValue()[0];

  return (
    <Layout>
      <Empty />
      <Header>
        <KarteTab />
      </Header>
      <Main>
        {patientList.map((patient) => {
          const show = currentPatient?.ptId === patient.ptId;
          return (
            <KarteProvider
              key={patient.ptId}
              initialState={initialKarteState}
              reducer={karteReducer}
            >
              <Inspector show={show.toString()} patient={patient} />
            </KarteProvider>
          );
        })}
      </Main>
      {inputToEdit && <InputEditor show={"true"} />}
      {diagnosisToChange && <DiagnosisChanger target={diagnosisToChange} patient={currentPatient}/>}
      {bundleToChange && <BundleChanger target={bundleToChange} patient={currentPatient}/>}
      {inputToChange && <InputChanger target={inputToChange} />}
      {showSchemaPanel && <SchemaPanel />}
      {schemaToEdit && <SchemaEditor target={schemaToEdit} />}
      {imageFileToUpload && <ImageUploader target={imageFileToUpload} />}
      {pdfFileToUpload && <PDFUploader target={pdfFileToUpload} />}
    </Layout>
  );
};

const Layout = styled.div`
  display: grid;
  grid-template-columns: minmax(25%, 0) 1fr;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "e h"
    "c c";
`;

const Empty = styled.div`
  grid-area: e;
`;

const Header = styled.div`
  grid-area: h;
`;

const Main = styled.div`
  grid-area: c;
`;

const DisplayBlockRoomKarte = withDisplayBlock(RoomKarte);
export default DisplayBlockRoomKarte;
