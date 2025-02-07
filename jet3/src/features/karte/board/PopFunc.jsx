import connectionManager from '../../../io/connectionManager';

class PopFunc {
    
    download(data) {
        const { facilityId, pathToFile, fileId } = data;
        const token = connectionManager.getAccessToken();
        const mediaServer = import.meta.env.VITE_API_HOST;
        const arr = [];
        arr.push(`${mediaServer}${pathToFile}`);
        arr.push(`?facility_id=${facilityId}`);
        arr.push(`&pk=${fileId}`);
        arr.push(`&token=${token}`);
        const file_url = arr.join('');
        window.open(file_url);
    }
};

const instance = new PopFunc();
export default instance;