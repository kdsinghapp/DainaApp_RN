import axios from 'axios';

// Define a type for base URL (optional for better typing)
interface BaseUrl {
    url: string;
}

// Base URL object
export const base_url: BaseUrl = {
    url: 'https://api.daina.tech/api',
};

// Axios instance with base URL
export const API = axios.create({
    baseURL: 'https://api.daina.tech/api',
});

// export const MapApiKey = "AIzaSyA3t_cd32IuYTxlCkPMN4TNVJQXlsBjS1Y" ; 
export const MapApiKey = "AIzaSyCACEpHIFamZW5vjr4yg9Qn6ifZbvPdMDI";  
