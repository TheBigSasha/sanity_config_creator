import type { NextPage } from "next";
import Head from "next/head";
import styles from "../styles/Home.module.css";
import { FaChartLine, FaHome, FaReact, FaYoutube } from "react-icons/fa";
import { SanityTypeCreator } from "../components/SanityTypeCreator";

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Head>
        <title>Sanity CMS Boilerplate Generator</title>
        <meta
          name="description"
          content="Create Sanity CMS typescript content types, and corresponding queries."
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <header>
        <h3 className={styles.title} style={{ pointerEvents: "all" }}>
          Code Genreator for <a href="https://www.sanity.io">Sanity CMS</a>
        </h3>
      </header>

      <SanityTypeCreator />

      <footer className={styles.footer}>
        <a href="https://sasharesume.com/">
          <FaHome /> {`Author's Homepage`}
        </a>{" "}
        <a href={"https://github.com/TheBigSasha/sanity_config_creator"}>
          <FaChartLine /> Source Code
        </a>{" "}
        <a href={"https://www.youtube.com/@CS250"}>
          {" "}
          <FaYoutube> </FaYoutube> {`Author's Intro to CS Videos`}
        </a>{" "}
        <a href={"https://www.npmjs.com/package/tbsui"}>
          <FaReact /> React Components
        </a>
      </footer>
    </div>
  );
};

export default Home;
