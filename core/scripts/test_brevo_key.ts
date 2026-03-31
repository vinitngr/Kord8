import axios from "axios";

const API_KEY = "";

async function test() {
  try {
    const res = await axios.get("https://api.brevo.com/v3/account", {
      headers: { "api-key": API_KEY },
    });
    console.log("SUCCESS:", res.status, JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.log("FAILED:", err.response?.status, err.response?.data || err.message);
  }
}

test();
