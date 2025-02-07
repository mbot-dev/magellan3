
class InputFunc {

    bmi(params) {
        if (params?.length !== 2) {
            return '';
        }
        const [h, w] = params;
        const height = Number(h);  // cm
        const weight = Number(w);  // kg
        if (isNaN(height) ||
            isNaN(weight) ||
            height === 0 ||
            weight === 0) {
            return '';
        }
        const value = 10000*weight/(height*height);
        return value.toFixed(2);
    }

    bmiCategory(params) {
        if (params?.length !== 1) {
            return '';
        }
        const [bmi] = params;
        const value = Number(bmi);
        if (isNaN(value)) {
            return '';
        }
        let category;
        if (value < 18.5) {
            category = '低体重(痩せ型)';
        } else if (value >= 18.5 && value < 25) {
            category = '普通体重';
        } else if (value >= 25 && value < 30) {
            category = '肥満(1度)';
        } else if (value >= 30 && value < 35) {
            category = '肥満(2度)';
        } else if (value >= 35 && value < 40) {
            category = '肥満(3度)';
        } else if (value >= 40){
            category = '肥満(4度)';
        } else {
            category = '未定義';
        }
        return `${bmi} ${category}`;
    }

    spo2Category(params) {
        if (params?.length !== 1) {
            return '';
        }
        const [spo2] = params;
        const value = Number(spo2);
        if (isNaN(value)) {
            return '';
        }
        return value >= 90 ? 'N' : 'L';
    }
}

const instance = new InputFunc();
export default instance;
