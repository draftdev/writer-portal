// components/Layout.js
import React, { Component } from "react";
import Head from "next/head";

export default class Layout extends Component {
  render() {
    const { children } = this.props;
    return (
      <div>
        <Head>
          <title>Writer Portal | Draft.dev</title>
          <link rel="icon" href="/favicon.ico" />
          <link rel="preconnect" href="https://fonts.gstatic.com" />
          <link
            href="https://fonts.googleapis.com/css2?family=Assistant:wght@400;700&family=Roboto&display=swap"
            rel="stylesheet"
          />
        </Head>
        <header>
          <div className="logo">
            <a href="/" className="logo">
              DRAFT.DEV<br/>
              <span className="site-name">Writer Portal</span>
            </a>
          </div>
          <div className="nav-right">
            <a href="/"></a>
          </div>
        </header>
        {children}
        <footer>
          <p>For general inquiries or technical support, email <a href="mailto:editor@draft.dev">editor@draft.dev</a></p>
        </footer>
      </div>
    );
  }
}
