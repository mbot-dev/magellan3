import React from 'react';

const withDisplayNull = Component => props => {
    return props.show && (
        <Component {...props}/>
    )
};
export default withDisplayNull;
