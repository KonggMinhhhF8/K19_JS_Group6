import axios from "axios";
import {getAccessToken,getRefreshToken,clearToken,saveToken} from "../utils/tokenStorage.js";
import { refresh } from "./refreshService";
import {authGuard} from "../router/guards.js";
import router from "../router/index.js";



const API_URL = "https://wo365ovs53.execute-api.ap-southeast-1.amazonaws.com";

//Khởi tạo axios
const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        "Content-Type": "application/json",
    }
})

api.interceptors.request.use(
    (config) => {

        const token = getAccessToken();

        if(token){
            config.headers.Authorization =
                `Bearer ${token}`;
        }

        return config;
    },

    (error)=>{
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response)=>{
        return response;
    },

    async(error)=>{
        const originalRequest =
            error.config;

        if(
            error.response?.status === 400 &&
            !originalRequest._retry
        ){

            originalRequest._retry = true;

            try{
                const refreshToken = getRefreshToken();

                if (!refreshToken) {
                    clearToken();
                    router.navigate("/login");
                    return Promise.reject(error);
                }
                const response =
                    await refresh(
                        refreshToken
                    );

                saveToken(
                    response
                );

                originalRequest.headers.Authorization =
                    `Bearer ${response.accessToken}`;

                return api(originalRequest);

            }
            catch(refreshError){

                clearToken();

                router.navigate("/login");

                return Promise.reject(
                    refreshError
                );
            }
        }

        return Promise.reject(error);
    }
);

export default api;
