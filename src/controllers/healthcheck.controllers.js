import { apiResponse } from "../utils/api-response.js";  
import { apiError } from "../utils/api-error.js";

const healthCheck = async (req, res) => {
    try {
        // Pass message as string, data can be the object if needed
        const response = new apiResponse(
            200, 
            { data: "API is healthy" }, // message as part of data
            "Success" // status message
        );
        return res.status(200).json(response);
    } catch (error) {
        const response = new apiError(
            500, 
            null,
            "Internal Server Error"
        );
        return res.status(500).json(response);
    }
}

export { healthCheck };