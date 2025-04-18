const axios = require("axios");
require("dotenv").config();

let tokenCache = {
  token: null,
  expiresAt: 0,
};

async function getSpotifyToken() {
  const now = Date.now();
  if (tokenCache.token && tokenCache.expiresAt > now) return tokenCache.token;

  const res = await axios.post(
    "https://accounts.spotify.com/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization:
          "Basic " +
          Buffer.from(
            `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
          ).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { access_token, expires_in } = res.data;
  tokenCache.token = access_token;
  tokenCache.expiresAt = now + expires_in * 1000;
  return access_token;
}

module.exports = getSpotifyToken;
