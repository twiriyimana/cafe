"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import cafePhoto from "../images/cafe.jpeg";
import cafeLogo from "../images/ima.png";
import coffeeBeans from "../images/image.png";

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <Image src={cafeLogo} alt="" fill sizes="43px" />
    </span>
  );
}

export default function SignInPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [notice, setNotice] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Simple form validation feedback: this can be replaced with backend/API logic later.
    setNotice("Your sign-in form is ready to connect to your backend.");
  }

  return (
    <main className="login-shell">
      {/* FORM START: left-side brand/story section */}
      <section
        className="story-panel"
        aria-label="About Mug & Bean Cafe"
        style={{ backgroundImage: `linear-gradient(180deg, rgba(30, 16, 11, .22) 0%, rgba(30, 16, 11, .28) 45%, rgba(30, 16, 11, .78) 100%), url("${cafePhoto.src}")` }}
      >
        <a className="brand" href="#home" aria-label="Mug and Bean Cafe home">
          <BrandMark />
          <span className="brand-copy">
            <strong>Board's &amp;  cafe</strong>
            <small>CAFE MANAGEMENT</small>
          </span>
        </a>

        <div className="story-copy">
          <span className="eyebrow"><span /> MADE FOR THE LOVE OF COFFEE</span>
          <h1>Run every part of your coffee shop business with confidence.</h1>
          <p>From the morning rush to the final stock count, your café deserves a smoother way to work.</p>
          <div className="story-stat">
            <span className="stat-rule" />
            <span>GOOD COFFEE. BETTER BUSINESS.</span>
          </div>
        </div>
        <span className="photo-credit">A little more craft in every cup.</span>
      </section>

      {/* FORM START: right-side login form section */}
      <section
        className="auth-panel"
        aria-label="Sign in"
        style={{ backgroundImage: `linear-gradient(90deg, rgba(246, 237, 222, .08), rgba(246, 237, 222, .08)), url("${coffeeBeans.src}")` }}
      >
        <div className="auth-card">
          {/* LOGIN SECTION START */}
          <div className="card-heading">
            <h2>Welcome back</h2>
            <p className="card-description">Sign in to your Mug &amp; Bean workspace.</p>
          </div>

          {/* LOGIN FORM START */}
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <div className="input-wrap">
              <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2" /><path d="m3.5 5.5 6.5 5 6.5-5" /></svg>
              <input id="email" name="email" type="email" placeholder="you@yourcafe.com" autoComplete="email" required />
            </div>

            <div className="password-label-row">
              <label htmlFor="password">Password</label>
              <a href="mailto:support@mugandbean.cafe?subject=Password%20reset">Forgot password?</a>
            </div>
            <div className="input-wrap">
              <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="8.5" width="13" height="9" rx="2" /><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 12v2" /></svg>
              <input id="password" name="password" type={showPassword ? "text" : "password"} placeholder="Enter your password" autoComplete="current-password" required />
              <button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M3 3 17 17M8.6 8.7a2 2 0 0 0 2.7 2.7M6.2 5.2A9 9 0 0 1 10 4.3c4.1 0 6.7 3.2 7.5 5.7a8.5 8.5 0 0 1-2.1 3.4M4.4 6.5A8.7 8.7 0 0 0 2.5 10c.8 2.5 3.4 5.7 7.5 5.7 1 0 1.9-.2 2.7-.6" /></svg>
                ) : (
                  <svg viewBox="0 0 20 20" aria-hidden="true"><path d="M2.5 10s2.6-5.7 7.5-5.7 7.5 5.7 7.5 5.7-2.6 5.7-7.5 5.7-7.5-5.7-7.5-5.7Z" /><circle cx="10" cy="10" r="2.2" /></svg>
                )}
              </button>
            </div>

            <label className="remember-option">
              <input type="checkbox" name="remember" />
              <span className="custom-checkbox" aria-hidden="true" />
              <span>Keep me signed in</span>
            </label>

            <button className="submit-button" type="submit">
              Sign in <span aria-hidden="true">→</span>
            </button>
            <p className="secure-note"><span className="secure-dot" /> Your workspace is private and secure</p>
            {notice && <p className="form-notice" role="status">{notice}</p>}
          </form>

          <div className="card-bottom">
            <span>New to Mug &amp; Bean?</span> <a href="mailto:hello@mugandbean.cafe?subject=Workspace%20access">Talk to our team</a>
          </div>
          {/* LOGIN SECTION END */}
        </div>

        <footer className="auth-footer">
          <span>© 2026 Mug &amp; Bean Cafe</span>
          <span className="footer-links"><a href="mailto:hello@mugandbean.cafe?subject=Privacy">Privacy</a><i /> <a href="mailto:hello@mugandbean.cafe?subject=Terms">Terms</a></span>
        </footer>
      </section>
      {/* FORM END */}
    </main>
  );
}
