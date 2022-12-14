"use client"; // since we are using event listeners to log in and access data for now

import { useEffect, useState } from "react";
import axios from "axios";
import styles from "../styles/App.module.css";

export default function App() {
  const CLIENT_ID = "2f00ead973024ee8bbca49fa896bd640"; // Your client id
  const CLIENT_SECRET = process.env.CLIENT_SECRET; // Your secret
  const REDIRECT_URI = "http://localhost:3000"; // Your redirect uri
  const AUTH_ENDPOINT = "https://accounts.spotify.com/authorize";
  const RESPONSE_TYPE = "token";

  const [token, setToken] = useState("");
  const [searchKey, setSearchKey] = useState("");
  const [userInfo, setUsername] = useState("");
  const [artists, setArtists] = useState([]);
  const [topArtists, setTopArtists] = useState([]);
  const [topTracks, setTopTracks] = useState([]);

  useEffect(() => {
    const hash = window.location.hash;
    let token = window.localStorage.getItem("token");

    if (!token && hash) {
      token = hash
        .substring(1)
        .split("&")
        .find((elem) => elem.startsWith("access_token"))
        .split("=")[1];

      window.location.hash = "";
      window.localStorage.setItem("token", token);
    }

    setToken(token);
  }, []);

  const logout = () => {
    setToken("");
    window.localStorage.removeItem("token");
  };

  const searchArtists = async (e) => {
    e.preventDefault();
    const { data } = await axios.get("https://api.spotify.com/v1/search", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      params: {
        q: searchKey,
        type: "artist",
      },
    });

    console.log(data);

    setArtists(data.artists.items);
  };

  // authorization code
  const urlSearchParams = new URLSearchParams();
  const params = {
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: RESPONSE_TYPE,
    scope: "user-read-private user-read-email user-top-read",
  };
  Object.keys(params).forEach((key) =>
    urlSearchParams.append(key, params[key])
  );
  const spotify_auth_redirect_uri =
    AUTH_ENDPOINT + "?" + urlSearchParams.toString();

  // get user info
  // top 10 artists and tracks
  const getUserInfo = async () => {
    const userProfile = await axios
      .get("https://api.spotify.com/v1/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .catch((error) => console.log(error));

    const userName = userProfile.data.display_name;

    const topArtistsData = await axios
      .get("https://api.spotify.com/v1/me/top/artists", {
        params: { limit: 10 },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .catch((error) => console.log(error));

    // const topArtists = topArtistsData.data.items.map(
    //   (artist) => artist["name"]
    // );
    const topArtists = topArtistsData.data.items.slice(0, 10).map((artist) => ({
      artistName: artist.name,
      artistImage: artist.images[0].url,
      artistUrl: artist.external_urls.spotify,
    }));

    const topTracksData = await axios
      .get("https://api.spotify.com/v1/me/top/tracks", {
        params: { limit: 10 },
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .catch((error) => console.log(error));

    // const topTracks = topTracksData.data.items.map((track) => track["name"]);
    const topTracks = topTracksData.data.items.slice(0, 10).map((track) => ({
      title: track.name,
      artist: track.artists.map((_artist) => _artist.name).join(", "),
      songUrl: track.external_urls.spotify,
    }));

    // setUserInfo({ userProfile, topArtistsData, topTracksData });
    setUsername(userName);
    setTopArtists(topArtists);
    setTopTracks(topTracks);
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Spotify React</h1>
        <p className={styles.description}>
          {!token ? (
            <a href={spotify_auth_redirect_uri}>Login to Spotify</a>
          ) : (
            <div>
              <button onClick={logout}>Logout</button>
              <button onClick={getUserInfo}>Get User Info</button>
            </div>
          )}
        </p>
      </header>
      {topArtists.length && topTracks.length ? (
        <main className={styles.main}>
          <h2 className={styles.title}>Hey {userInfo}</h2>
          <h2 className={styles.title}>Your top 10 tracks and artists</h2>
          <div className={styles.grid}>
            {topArtists.map((artist) => (
              <div className={styles.card} key={artist.artistName}>
                <a href={artist.artistUrl}>
                  <h2>{artist.artistName}</h2>
                </a>
                {artist.artistImage && (
                  <img
                    className={styles.img}
                    src={artist.artistImage}
                    alt={artist.artistName}
                  />
                )}
              </div>
            ))}
          </div>
          <div className={styles.grid}>
            {topTracks.map((track) => (
              <div className={styles.card} key={track.title}>
                <a href={track.songUrl}>
                  <h2>{track.title}</h2>
                </a>
                <p>{track.artist}</p>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <p> no content</p>
      )}

      <form onSubmit={searchArtists}>
        <input type="text" onChange={(e) => setSearchKey(e.target.value)} />
        <button type={"submit"}>Search</button>
      </form>
      {artists.map((artist) => (
        <div key={artist.id}>
          {artist.name}
          {artist.images.length ? (
            <img width={"50%"} src={artist.images[0].url} alt="" />
          ) : (
            <div>No Image</div>
          )}
        </div>
      ))}
    </div>
  );
}
