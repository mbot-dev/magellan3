const DiseaseSearchResult = ({ data, onSelect, maxHeight }) => {
  const handleSelect = (e) => {
    const num = e.target.parentNode.getAttribute("data-item");
    const item = data[Number(num)];
    onSelect(item);
  };

  return (
    <div
      className="z3-calc-scroll-container"
      style={{ "--max-height": maxHeight }}
    >
      <table className="w3-table w3-hoverable z3-karte">
        <tbody>
          {data.map((item, index) => {
            const { code, name, icd_10_1_2013, icd_10_2_2013, singleUse } =
              item;
            return (
              <tr
                key={code}
                className="w3-border-bottom"
                data-item={index}
                onClick={handleSelect}
              >
                <td>{code}</td>
                <td>{name}</td>
                <td>{icd_10_1_2013}</td>
                <td>{icd_10_2_2013}</td>
                <td>{singleUse}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DiseaseSearchResult;
