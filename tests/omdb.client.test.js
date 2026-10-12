const axios = require("axios");

const {
  requestOmdb,
  OMDB_BASE_URL,
  OMDB_TIMEOUT_MS,
} = require("../src/utils/omdb.client");
const { getMovieById } = require("../src/utils/omdb.helper");

describe("OMDb client", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("uses HTTPS and a timeout for shared OMDb requests", async () => {
    const movie = { imdbID: "tt0133093", Response: "True" };
    const axiosGetSpy = jest
      .spyOn(axios, "get")
      .mockResolvedValue({ data: movie });

    await expect(requestOmdb({ i: movie.imdbID })).resolves.toBe(movie);

    expect(OMDB_BASE_URL).toBe("https://www.omdbapi.com/");
    expect(axiosGetSpy).toHaveBeenCalledWith(OMDB_BASE_URL, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: movie.imdbID,
      },
      timeout: OMDB_TIMEOUT_MS,
    });
  });

  it("routes movie detail lookups through the shared client settings", async () => {
    const movie = { imdbID: "tt0133093", Response: "True" };
    const axiosGetSpy = jest
      .spyOn(axios, "get")
      .mockResolvedValue({ data: movie });

    await expect(getMovieById(movie.imdbID)).resolves.toBe(movie);

    expect(axiosGetSpy).toHaveBeenCalledWith(OMDB_BASE_URL, {
      params: {
        apikey: process.env.OMDB_API_KEY,
        i: movie.imdbID,
        plot: "short",
      },
      timeout: OMDB_TIMEOUT_MS,
    });
  });
});
