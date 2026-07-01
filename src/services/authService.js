import api from './api';
import {saveToken,getAccessToken,getRefreshToken,clearToken} from "../utils/tokenStorage.js";
import router from "../router/index.js";

const login = async (data) => {
    const response = await api.post('/auth/signin', data);
    saveToken(response.data)
    return response.data;
}

const logout = () =>{
    clearToken()
    router.navigate('/login')
}

export {login,logout}