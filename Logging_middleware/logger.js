const axios = require("axios");
require("dotenv").config();

const TOKEN = process.env.TOKEN;
async function Log(stack, level, packageName, message) {

  const data = {
    stack,
    level,
    package: packageName,
    message
  };

  try {

    const response = await axios.post(
      "http://4.224.186.213/evaluation-service/logs",
      data,
      {
        headers: {
          Authorization: `Bearer ${TOKEN}`
        }
      }
    );

    console.log(response.data);

  } catch (error) {

    console.log("Error sending log");

    if (error.response) {
      console.log(error.response.data);
    }
  }
}

module.exports = Log;