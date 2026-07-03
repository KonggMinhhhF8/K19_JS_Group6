import axios from "axios";

const API_URL = "https://wo365ovs53.execute-api.ap-southeast-1.amazonaws.com";

const refresh = async (refreshToken) => {
    const response = await axios.post(
        `${API_URL}/auth/refresh-token`,
        { refreshToken },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );

    return response.data;
};

export { refresh };