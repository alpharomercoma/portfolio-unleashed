import Axios from "axios";
import { env } from "@/env";
const axios = Axios.create({
	baseURL: env.NEXT_PUBLIC_API_URL,
});

export default axios;
