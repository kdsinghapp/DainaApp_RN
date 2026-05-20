import axios from 'axios';

// Define a type for base URL (optional for better typing)
interface BaseUrl {
    url: string;
}

// Base URL object
export const base_url: BaseUrl = {
    url: 'https://server-php-8-3.technorizen.com/chewbe/api',
};

// Axios instance with base URL
export const API = axios.create({
    baseURL: 'https://server-php-8-3.technorizen.com/chewbe/api',
});

// export const MapApiKey = "AIzaSyA3t_cd32IuYTxlCkPMN4TNVJQXlsBjS1Y" ; 
export const MapApiKey = "AIzaSyCACEpHIFamZW5vjr4yg9Qn6ifZbvPdMDI" ;  
