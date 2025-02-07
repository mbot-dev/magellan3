
const TEXT_NO_DATA = '登録されていません';

export const FirstWrapper = ({title, onEdit, length, children}) => {
    return length === 0 ? (
        <p>{TEXT_NO_DATA}</p>
     ) : (
        <div>
            <div className='z3-flex'>
                {title}
                {onEdit && <button className='w3-button w3-round-small w3-padding-small' type='button' onClick={onEdit}>編集</button>}
            </div>
            <table className='w3-table w3-bordered'>
                {children}
            </table>
        </div>
     );
};